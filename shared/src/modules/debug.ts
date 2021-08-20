import { LogMessage } from '../logging'
import { ModuleVersion } from '../data'
import { ModuleStateData, ModuleConfigData, Module, ModuleMap } from './common'

export interface DebugStateData extends ModuleStateData {
    logs: LogMessage[]
}

export interface DebugConfigData extends ModuleConfigData {
    overlayLogs: boolean
}

export const DebugModule: Module<DebugStateData, DebugConfigData> = {
    name: 'Debug',
    description: 'Provides information and tools for testing and debugging the control panel. Don\'t enable unless you know what you\'re doing!',
    version: ModuleVersion.alpha,
    getData: (modules: ModuleMap) => modules.debug,
    scopes: [],
}
