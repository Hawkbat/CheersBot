import { ModuleVersion } from '../data'
import { ModuleStateData, ModuleConfigData, Module, ModuleMap } from './common'

export const OBSWebSocketUrl = 'localhost'
export const OBSWebSocketPort = 4444

export interface OBSStateData extends ModuleStateData {

}

export interface OBSConfigData extends ModuleConfigData {
    debugOverlay: boolean
    apiHost: string
    apiPort: number
}

export const OBSModule: Module<OBSStateData, OBSConfigData> = {
    name: 'OBS Control',
    description: 'Allows OBS sources to be manipulated by trigger events.',
    version: ModuleVersion.preAlpha,
    getData: (modules: ModuleMap) => modules.obs,
    scopes: [],
}
