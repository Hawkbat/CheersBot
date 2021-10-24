import * as React from 'react'
import { VTubeStudioConfigData, VTubeStudioStateData, randomItem, randomWeightedItem, logError } from 'shared'
import * as vts from 'vtubestudio'
import { BufferedWebsocket, channelAction, runUntil, useDebounce, useRepeatingEffect, wait, waitUntil } from './utils'
import iconUri from './vts-plugin-icon.png'

const icon = iconUri.substr(iconUri.indexOf(',') + 1)

const CONTROL_PANEL_TOKEN_KEY = 'cheers-bot-vtstudio-token-control-panel'
const OVERLAY_TOKEN_KEY = 'cheers-bot-vtstudio-token'

const VTS_MODEL_SWAP_COOLDOWN = 2500

export class VTSClient {
    plugin!: vts.Plugin
    ws: BufferedWebsocket

    constructor(tokenKey: string, name: string, websocketUrl: string = 'ws://localhost:8001') {
        this.ws = new BufferedWebsocket(websocketUrl)

        const bus = new vts.WebSocketBus(this.ws)
        const apiClient = new vts.ApiClient(bus)
        const initialToken = localStorage.getItem(tokenKey) ?? undefined
        this.plugin = new vts.Plugin(apiClient, name, 'Hawkbar', icon, initialToken, token => localStorage.setItem(tokenKey, token))
    }
}

export function useVTubeStudioConnection(props: { type: 'control-panel' | 'overlay', config: VTubeStudioConfigData, state: VTubeStudioStateData }) {
    const [connected, setConnected] = React.useState(false)
    const [apiError, setApiError] = React.useState<Error | null>(null)

    const client = React.useMemo(() => {
        const client = new VTSClient(props.type === 'control-panel' ? CONTROL_PANEL_TOKEN_KEY : OVERLAY_TOKEN_KEY, props.type === 'control-panel' ? 'Cheers Bot Control Panel' : 'Cheers Bot Overlay', `ws://${props.config.apiHost}:${props.config.apiPort}`)
        client.ws.addEventListener('open', () => setConnected(true))
        client.ws.addEventListener('close', () => setConnected(false))
        return client
    }, [])

    React.useEffect(() => {
        client.ws.url = `ws://${props.config.apiHost}:${props.config.apiPort}`
    }, [client, props.config.apiHost, props.config.apiPort])

    const execute = React.useCallback(async (cb: () => Promise<void>) => {
        try {
            await cb()
        } catch (e) {
            // Swallow authentication errors, to prevent clogging up the global logs
            if (!String(e).includes('Plugin could not authenticate')) {
                logError(CHANNEL_NAME, 'vts', 'Error excuting VTube Studio command', e)
                setApiError(e)
            }
        }
    }, [])

    return { connected, apiError, client, execute }
}

export function useVTubeStudioProcessing(props: { enabled: boolean, connected: boolean, apiError: Error | null, client: VTSClient, execute: (cb: () => Promise<void>) => Promise<void>, config: VTubeStudioConfigData, state: VTubeStudioStateData }) {
    const redeemedSwaps = React.useRef<Record<string, boolean>>({})
    const redeemedTriggers = React.useRef<Record<string, boolean>>({})
    const redeemedTints = React.useRef<Record<string, boolean>>({})

    const setStatus = useDebounce(React.useCallback(async () => {
        if (!props.enabled) return
        const clearError = !props.state.status.connected && props.connected
        await channelAction('vtstudio/set-status', { time: Date.now(), connected: props.connected, apiError: props.apiError && !clearError ? JSON.stringify(props.apiError) : '', readyState: props.client.ws.readyState })
    }, [props.enabled, props.connected, props.apiError, props.client.ws.readyState]))

    useRepeatingEffect(setStatus, 25000, true)

    const pollSwapRedeems = useDebounce(React.useCallback(async () => {
        if (!props.enabled) return
        const pendingSwaps = props.state.swaps.filter(s => !redeemedSwaps.current[s.id])

        for (const swap of pendingSwaps) {
            await props.execute(async () => {
                const config = props.config.swaps.find(c => c.id === swap.configID)
                if (config) {
                    const models = await props.client.plugin.models()
                    const currentModel = await props.client.plugin.currentModel()
                    const position = await currentModel?.position()
                    const validModels = models.filter(m => config.models.some(c => c.id === m.id || c.name === m.name) && m.id !== currentModel?.id && m.name !== currentModel?.name)
                    let selectedModel: typeof validModels[0] | null = null

                    if (config.type === 'one') selectedModel = validModels[0]
                    else if (config.type === 'any') selectedModel = randomItem(validModels)
                    else if (config.type === 'weighted-any') selectedModel = randomWeightedItem(validModels, m => config.models.find(c => c.id === m.id || c.name === m.name)?.weight ?? 1)

                    const selectedModelConfig = config.models.find(c => c.id === selectedModel?.id || c.name === selectedModel?.name)

                    if (selectedModel) {
                        await selectedModel.load()
                        if (selectedModelConfig?.position) {
                            await waitUntil(async () => (await props.client.plugin.currentModel())?.id === selectedModel?.id)
                            await props.client.plugin.apiClient.moveModel({
                                timeInSeconds: 0.5,
                                valuesAreRelativeToModel: false,
                                ...selectedModelConfig?.position,
                            })
                        }

                        if (config.after === 'revert') {
                            (async () => {
                                await wait(Math.max((config.revertDelay ?? config.duration) * 1000, VTS_MODEL_SWAP_COOLDOWN) + 100)
                                await models.find(m => m.id === currentModel?.id || m.name === currentModel?.name)?.load()
                                if (position) {
                                    await waitUntil(async () => (await props.client.plugin.currentModel())?.id === currentModel?.id)
                                    await props.client.plugin.apiClient.moveModel({
                                        timeInSeconds: 0.5,
                                        valuesAreRelativeToModel: false,
                                        ...position,
                                    })
                                }
                            })()
                        } else if (config.after === 'config' && config.afterConfig) {
                            (async () => {
                                await wait(Math.max((config.revertDelay ?? config.duration) * 1000, VTS_MODEL_SWAP_COOLDOWN) + 100)
                                await channelAction('vtstudio/mock-model-swap', { id: config.afterConfig ?? '', userID: swap.userID, userName: swap.userName })
                            })()
                        }

                        await (async () => {
                            await wait(Math.max(config.duration * 1000, VTS_MODEL_SWAP_COOLDOWN))
                            await channelAction('vtstudio/complete-model-swap', { id: swap.id })
                            await wait(VTS_MODEL_SWAP_COOLDOWN)
                        })()
                        redeemedSwaps.current = { ...redeemedSwaps.current, [swap.id]: true }
                    }
                }
            })
        }
    }, [props.enabled, props.client, props.execute, props.state.swaps]))
    useRepeatingEffect(pollSwapRedeems, 1000, false)

    const pollTriggerRedeems = useDebounce(React.useCallback(async () => {
        if (!props.enabled) return
        const pendingTriggers = props.state.triggers.filter(s => !redeemedTriggers.current[s.id])

        for (const trigger of pendingTriggers) {
            await props.execute(async () => {
                const config = props.config.triggers.find(c => c.id === trigger.configID)
                if (config) {
                    const currentModel = await props.client.plugin.currentModel()
                    const hotkeys = await currentModel?.hotkeys()
                    if (currentModel && hotkeys) {
                        const validHotkeys = hotkeys.filter(h => config.hotkeys.some(c => c.id === h.id || c.name === h.name))
                        let selectedHotkeys
                        if (validHotkeys.length) {
                            if (config.type === 'one') selectedHotkeys = [validHotkeys[0]]
                            else if (config.type === 'any') selectedHotkeys = [randomItem(validHotkeys)]
                            else if (config.type === 'weighted-any') selectedHotkeys = [randomWeightedItem(validHotkeys, h => config.hotkeys.find(c => c.id === h.id || c.name === h.name)?.weight ?? 1)]
                            else if (config.type === 'all') selectedHotkeys = validHotkeys
                        }
                        if (selectedHotkeys && selectedHotkeys.length) {
                            if (config.after === 'retrigger') {
                                (async () => {
                                    await wait((config.retriggerDelay ?? config.duration) * 1000 + 100)
                                    await Promise.all(selectedHotkeys.map(h => h.trigger()))
                                })()
                            } else if (config.after === 'config' && config.afterConfig) {
                                (async () => {
                                    await wait((config.retriggerDelay ?? config.duration) * 1000 + 100)
                                    await channelAction('vtstudio/mock-hotkey-trigger', { id: config.afterConfig ?? '', userID: trigger.userID, userName: trigger.userName })
                                })()
                            }
                            await Promise.all(selectedHotkeys.map(h => h.trigger()))
                            await (async () => {
                                await wait(config.duration * 1000)
                                await channelAction('vtstudio/complete-hotkey-trigger', { id: trigger.id })
                            })()
                            redeemedTriggers.current = { ...redeemedTriggers.current, [trigger.id]: true }
                        }
                    }
                }
            })
        }
    }, [props.enabled, props.client, props.execute, props.state.triggers]))
    useRepeatingEffect(pollTriggerRedeems, 1000, false)

    const pollTintRedeems = useDebounce(React.useCallback(async () => {
        if (!props.enabled) return
        const pendingTints = props.state.tints.filter(t => !redeemedTints.current[t.id])
        for (const tint of pendingTints) {
            await props.execute(async () => {
                const config = props.config.tints.find(c => c.id === tint.configID)
                if (config) {
                    const currentModel = await props.client.plugin.currentModel()
                    if (currentModel) {
                        if (config.type === 'all') {
                            await currentModel.colorTint(config.color)
                        } else if (config.type === 'match') {
                            await Promise.all(config.matches.map(m => currentModel.colorTint(m.color, { nameExact: m.names, tagExact: m.tags })))
                        }
                        if (config.after === 'reset') {
                            (async () => {
                                await wait((config.resetDelay ?? config.duration) * 1000 + 100)
                                if (config.type === 'all' || config.type === 'rainbow') {
                                    await currentModel.colorTint({ r: 255, g: 255, b: 255 })
                                } else if (config.type === 'match') {
                                    await Promise.all(config.matches.map(m => currentModel.colorTint({ r: 255, g: 255, b: 255 }, { nameExact: m.names, tagExact: m.tags })))
                                }
                            })()
                        } else if (config.after === 'config' && config.afterConfig) {
                            (async () => {
                                await wait((config.resetDelay ?? config.duration) * 1000 + 100)
                                await channelAction('vtstudio/mock-color-tint', { id: config.afterConfig ?? '', userID: tint.userID, userName: tint.userName })
                            })()
                        }
                        await Promise.all([
                            (async () => {
                                if (config.type === 'rainbow') {
                                    await runUntil(config.duration * 1000, ms => {
                                        const hsvToRgb = (h: number, s: number, v: number) => {
                                            let f = (n: number, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0)
                                            const c = (n: number) => Math.min(255, Math.max(0, Math.round(n * 255)))
                                            return { r: c(f(5)), g: c(f(3)), b: c(f(1)) }
                                        }
                                        currentModel.colorTint(hsvToRgb((ms / 1000 * 360 * config.rainbowSpeed) % 360, 1, 1))
                                    })
                                }
                            })(),
                            (async () => {
                                await wait(config.duration * 1000)
                                await channelAction('vtstudio/complete-color-tint', { id: tint.id })
                            })(),
                        ])
                        redeemedTints.current = { ...redeemedTints.current, [tint.id]: true }
                    }
                }
            })
        }
    }, [props.enabled, props.client, props.execute, props.state.tints]))
    useRepeatingEffect(pollTintRedeems, 1000, false)
}
