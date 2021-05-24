import { ModuleVersion } from '../data'
import { ModuleStateData, ModuleConfigData, Module, ModuleMap } from './common'

export interface DebugStateData extends ModuleStateData {

}

export interface DebugConfigData extends ModuleConfigData {

}

export const DebugModule: Module<DebugStateData, DebugConfigData> = {
    name: 'Debug',
    description: 'Provides information and tools for testing and debugging the control panel. Don\'t enable unless you know what you\'re doing!',
    version: ModuleVersion.alpha,
    getData: (modules: ModuleMap) => modules.debug,
}
