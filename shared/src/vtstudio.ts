import { generateID } from './utils'

class VTubeStudioError extends Error {
    constructor(data: ApiError['data'], ...params: any) {
        super(params)
        this.name = this.constructor.name
    }
}

interface BaseParameter {
    name: string
    value: number
    min: number
    max: number
    default: number
}

interface Live2DParameter extends BaseParameter { }

interface VTSParameter extends BaseParameter {
    addedBy: string
}

interface ApiMessage<Type extends string, Data extends object | undefined = undefined> {
    apiName: 'VTubeStudioPublicAPI'
    apiVersion: `${number}.${number}`
    requestID: string
    messageType: Type
    data: Data
}

interface ApiError extends ApiMessage<'Error', {
    errorID: number
    message: string
}> { }

interface ApiEndpoint<Type extends string, Request extends object | undefined, Response extends object | undefined> {
    Type: Type
    Request: ApiMessage<`${Type}Request`, Request>
    Response: ApiMessage<`${Type}Response`, Response>
}

interface ApiStateEndpoint extends ApiEndpoint<'ApiState', undefined, { active: boolean, vTubeStudioVersion: `${number}.${number}.${number}` }> { }

interface AuthenticationTokenEndpoint extends ApiEndpoint<'AuthenticationToken', { pluginName: string, pluginDeveloper: string }, { authenticationToken: string }> { }

interface AuthenticationEndpoint extends ApiEndpoint<'Authentication', { authenticationToken: string }, undefined> { }

interface ModelNameEndpoint extends ApiEndpoint<'ModelName', undefined, { modelName: string, modelID: string }> { }

interface AvailableModelsEndpoint extends ApiEndpoint<'AvailableModels', undefined, { availableModels: { modelName: string, modelID: string }[] }> { }

interface ModelLoadEndpoint extends ApiEndpoint<'ModelLoad', { modelID: string }, undefined> { }

interface HotkeysInCurrentModelEndpoint extends ApiEndpoint<'HotkeysInCurrentModel', undefined, { modelName: string, availableHotkeys: { name: string, type: string, hotkeyID: string }[] }> { }

interface HotkeyTriggerEndpoint extends ApiEndpoint<'HotkeyTrigger', { hotkeyID: string }, undefined> { }

interface ParameterListEndpoint extends ApiEndpoint<'ParameterList', undefined, { customParameters: VTSParameter[], defaultParameters: VTSParameter[] }> { }

interface ParameterValueEndpoint extends ApiEndpoint<'ParameterValue', { name: string }, VTSParameter> { }

interface Live2DParameterListEndpoint extends ApiEndpoint<'Live2DParameterList', undefined, { parameters: Live2DParameter[] }> { }

interface ParameterCreationEndpoint extends ApiEndpoint<'ParameterCreation', { parameterName: string, createdBy: string, min: number, max: number, default: number }, { parameterName: string }> { }

interface ParameterDeletionEndpoint extends ApiEndpoint<'ParameterDeletion', { parameterName: string }, { parameterName: string }> { }

interface InjectParameterDataEndpoint extends ApiEndpoint<'InjectParameterData', { parameterValues: { id: string, value: number }[] }, undefined> { }

type EndpointCall<T extends ApiEndpoint<any, any, any>> = T extends ApiEndpoint<infer Type, infer Request, infer Response> ?
    (Request extends undefined ?
        (Response extends undefined ?
            () => Promise<void> :
            () => Promise<Response>) :
        (Response extends undefined ?
            (data: Request) => Promise<void> :
            (data: Request) => Promise<Response>)) :
    never

export type MessageHandler<T extends ApiMessage<any, any> = ApiMessage<any, any>> = (msg: T) => void

export interface MessageBus {
    send: <T extends ApiMessage<any, any>>(msg: T) => void
    on: (handler: MessageHandler) => void
    off: (handler: MessageHandler) => void
}

function makeRequestMsg<T extends ApiEndpoint<any, any, any>>(type: T['Type'], requestID: string, data: T['Request']['data']): T['Request'] {
    return {
        apiName: 'VTubeStudioPublicAPI',
        apiVersion: '1.0',
        messageType: `${type}Request` as T['Request']['messageType'],
        requestID,
        data,
    }
}

function msgIsResponse<T extends ApiEndpoint<any, any, any>>(msg: ApiMessage<any, any>, type: T['Type']): msg is T['Response'] {
    return msg.messageType === `${type}Response`
}

function msgIsError(msg: ApiMessage<any, any>): msg is ApiError {
    return msg.messageType === 'Error'
}

function createCall<T extends ApiEndpoint<any, any, any>>(bus: MessageBus, type: T['Type']): EndpointCall<T> {
    return ((data: T['Request']['data']) => new Promise<T['Response']['data']>((resolve, reject) => {
        const requestID = generateID(16)
        const handler = (msg: ApiMessage<any, any>) => {
            if (msg.requestID === requestID) {
                bus.off(handler)
                clearTimeout(timeout)
                if (msgIsResponse<T>(msg, type))
                    resolve(msg.data)
                else if (msgIsError(msg))
                    reject(new VTubeStudioError(msg.data))
            }
        }
        const timeout = setTimeout(() => {
            bus.off(handler)
            reject(new VTubeStudioError({ errorID: -1, message: 'The request timed out.' }))
        }, 5000)
        bus.on(handler)
        bus.send(makeRequestMsg(type, requestID, data))
    })) as EndpointCall<T>
}

export class ApiClient {
    constructor(private bus: MessageBus) { }

    apiState = createCall<ApiStateEndpoint>(this.bus, 'ApiState')
    authenticationToken = createCall<AuthenticationTokenEndpoint>(this.bus, 'AuthenticationToken')
    authentication = createCall<AuthenticationEndpoint>(this.bus, 'Authentication')
    modelName = createCall<ModelNameEndpoint>(this.bus, 'ModelName')
    availableModels = createCall<AvailableModelsEndpoint>(this.bus, 'AvailableModels')
    modelLoad = createCall<ModelLoadEndpoint>(this.bus, 'ModelLoad')
    hotkeysInCurrentModel = createCall<HotkeysInCurrentModelEndpoint>(this.bus, 'HotkeysInCurrentModel')
    hotkeyTrigger = createCall<HotkeyTriggerEndpoint>(this.bus, 'HotkeyTrigger')
    parameterList = createCall<ParameterListEndpoint>(this.bus, 'ParameterList')
    parameterValue = createCall<ParameterValueEndpoint>(this.bus, 'ParameterValue')
    live2DParameterList = createCall<Live2DParameterListEndpoint>(this.bus, 'Live2DParameterList')
    parameterCreation = createCall<ParameterCreationEndpoint>(this.bus, 'ParameterCreation')
    parameterDeletion = createCall<ParameterDeletionEndpoint>(this.bus, 'ParameterDeletion')
    injectParameterData = createCall<InjectParameterDataEndpoint>(this.bus, 'InjectParameterData')
}

class Parameter {
    constructor(protected vts: Plugin, public readonly model: CurrentModel, public readonly name: string, public value: number, public min: number, public max: number, public defaultValue: number) { }

    async refresh(): Promise<Parameter> {
        await this.vts.apiPreChecks()
        const { value, min, max, default: defaultValue } = await this.vts.apiClient.parameterValue({ name: this.name })
        this.value = value
        this.min = min
        this.max = max
        this.defaultValue = defaultValue
        return this
    }

    async setValue(value: number): Promise<Parameter> {
        await this.vts.apiPreChecks()
        await this.vts.apiClient.injectParameterData({ parameterValues: [{ id: this.name, value }] })
        this.value = value
        return this
    }
}

class CustomParameter extends Parameter {
    constructor(protected vts: Plugin, public readonly model: CurrentModel, public readonly name: string, public value: number, public min: number, public max: number, public defaultValue: number, public readonly addedBy: string) { super(vts, model, name, value, min, max, defaultValue) }

    async update({ min, max, defaultValue }: Partial<{ min: number, max: number, defaultValue: number }>): Promise<Parameter> {
        await this.vts.apiPreChecks()
        await this.vts.apiClient.parameterCreation({ parameterName: this.name, createdBy: this.addedBy, min: min ?? this.min, max: max ?? this.max, default: defaultValue ?? this.defaultValue })
        this.min = min ?? this.min
        this.max = max ?? this.max
        this.defaultValue = defaultValue ?? this.defaultValue
        return this
    }

    async delete(): Promise<void> {
        await this.vts.apiPreChecks()
        await this.vts.apiClient.parameterDeletion({ parameterName: this.name })
    }
}

class Hotkey {
    constructor(protected vts: Plugin, public readonly model: CurrentModel, public readonly id: string, public readonly type: string, public readonly name: string) { }

    async trigger(): Promise<void> {
        await this.vts.apiPreChecks()
        await this.vts.apiClient.hotkeyTrigger({ hotkeyID: this.id })
    }
}

class Model {
    constructor(protected vts: Plugin, public readonly id: string, public readonly name: string) { }

    async load(): Promise<CurrentModel> {
        await this.vts.apiPreChecks()
        await this.vts.apiClient.modelLoad({ modelID: this.id })
        return new CurrentModel(this.vts, this.id, this.name)
    }
}

class CurrentModel {
    constructor(protected vts: Plugin, public readonly id: string, public readonly name: string) { }

    async hotkeys(): Promise<Hotkey[]> {
        await this.vts.apiPreChecks()
        const { availableHotkeys } = await this.vts.apiClient.hotkeysInCurrentModel()
        return availableHotkeys.map(k => new Hotkey(this.vts, this, k.hotkeyID, k.type, k.name))
    }

    async live2DParameters(): Promise<Parameter[]> {
        await this.vts.apiPreChecks()
        const { parameters } = await this.vts.apiClient.live2DParameterList()
        return parameters.map(p => new Parameter(this.vts, this, p.name, p.value, p.min, p.max, p.default))
    }

    async customParameters(): Promise<Parameter[]> {
        await this.vts.apiPreChecks()
        const { customParameters } = await this.vts.apiClient.parameterList()
        return customParameters.map(p => new CustomParameter(this.vts, this, p.name, p.value, p.min, p.max, p.default, p.addedBy))
    }

    async defaultParameters(): Promise<Parameter[]> {
        await this.vts.apiPreChecks()
        const { defaultParameters } = await this.vts.apiClient.parameterList()
        return defaultParameters.map(p => new Parameter(this.vts, this, p.name, p.value, p.min, p.max, p.default))
    }

    async createParameter(name: string, min: number, max: number, defaultValue: number): Promise<CustomParameter> {
        await this.vts.apiPreChecks()
        await this.vts.apiClient.parameterCreation({ parameterName: name, createdBy: this.vts.name, min, max, default: defaultValue })
        return new CustomParameter(this.vts, this, name, defaultValue, min, max, defaultValue, this.vts.name)
    }
}

export class Plugin {
    protected isApiEnabled: boolean | null = null
    protected isAuthenticated: boolean | null = null

    constructor(public apiClient: ApiClient, public name: string, public author: string, protected authenticationToken: string | undefined) { }

    async checkApiState(): Promise<void> {
        if (this.isApiEnabled === null) {
            const { active } = await this.apiClient.apiState()
            this.isApiEnabled = active
        }
        if (!this.isApiEnabled) throw new VTubeStudioError({ errorID: -1, message: 'API access is disabled.' })
    }

    async authenticate(): Promise<void> {
        if (this.isAuthenticated === null) {
            if (this.authenticationToken !== undefined) {
                try {
                    await this.apiClient.authentication({ authenticationToken: this.authenticationToken })
                } catch (e) {
                    console.error(e)
                }
            } else {
                const { authenticationToken } = await this.apiClient.authenticationToken({ pluginDeveloper: this.author, pluginName: this.name })
                this.authenticationToken = authenticationToken
            }
            this.isAuthenticated = true
        }
        if (!this.isAuthenticated) throw new VTubeStudioError({ errorID: -1, message: 'Plugin could not authenticate.' })
    }

    public async apiPreChecks(): Promise<void> {
        await this.checkApiState()
        await this.authenticate()
    }

    async models(): Promise<Model[]> {
        await this.apiPreChecks()
        const { availableModels } = await this.apiClient.availableModels()
        return availableModels.map(m => new Model(this, m.modelID, m.modelName))
    }

    async currentModel(): Promise<CurrentModel> {
        await this.apiPreChecks()
        const { modelID, modelName } = await this.apiClient.modelName()
        return new CurrentModel(this, modelID, modelName)
    }

    async getAuthenticationToken(): Promise<string> {
        await this.apiPreChecks()
        return this.authenticationToken ?? ''
    }
}
