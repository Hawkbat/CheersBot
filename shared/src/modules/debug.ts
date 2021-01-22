import { ChannelData, ModuleVersion } from '../data'
import { ModuleStateData, ModuleConfigData, Module } from './common'

export interface DebugStateData extends ModuleStateData {

}

export interface DebugConfigData extends ModuleConfigData {

}

export const DebugModule: Module<DebugStateData, DebugConfigData> = {
    name: 'Debug',
    description: 'Provides information and tools for testing and debugging the control panel. Don\'t enable unless you know what you\'re doing!',
    version: ModuleVersion.alpha,
    getData: (data: ChannelData) => data.modules.debug,
}
