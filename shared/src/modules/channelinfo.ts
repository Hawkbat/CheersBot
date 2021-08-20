import { ModuleVersion } from '../data'
import { ModuleStateData, ModuleConfigData, Module, ModuleMap } from './common'

export interface ChannelInfoStateData extends ModuleStateData {

}

export interface ChannelInfoConfigData extends ModuleConfigData {
    accentColor: string
    mutedColor: string
    commandPrefix: string
    overlayCorner?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    experimentalModules?: boolean
    activeBot: string
}

export const ChannelInfoModule: Module<ChannelInfoStateData, ChannelInfoConfigData> = {
    name: 'User and Channel Info',
    description: 'Displays information about the current user and channel. Don\'t disable unless you know what you\'re doing!',
    version: ModuleVersion.released,
    getData: (modules: ModuleMap) => modules.channelInfo,
    scopes: [],
}
