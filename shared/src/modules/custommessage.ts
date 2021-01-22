import { Icon, ChannelData, ModuleVersion } from '../data'
import { ModuleStateData, ModuleConfigData, Module } from './common'

export interface CustomMessage {
    id: string
    emote: Icon | null
    message: string
    visible: boolean
}

export interface CustomMessageStateData extends ModuleStateData {
    messages: CustomMessage[]
}

export interface CustomMessageConfigData extends ModuleConfigData {

}

export const CustomMessageModule: Module<CustomMessageStateData, CustomMessageConfigData> = {
    name: 'Custom Messages',
    description: 'Displays custom overlay messages similar to the ones used by other features.',
    version: ModuleVersion.beta,
    getData: (data: ChannelData) => data.modules.customMessage,
}
