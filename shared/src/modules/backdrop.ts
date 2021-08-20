import { ModuleVersion } from '../data'
import { ModuleStateData, ModuleConfigData, Module, ModuleMap } from './common'

export interface BackdropStateData extends ModuleStateData {

}

export interface BackdropConfigData extends ModuleConfigData {

}

export const BackdropModule: Module<BackdropStateData, BackdropConfigData> = {
    name: 'Backdrop',
    description: 'Interactive Unity application backdrops controlled remotely from the control panel.',
    version: ModuleVersion.preAlpha,
    getData: (modules: ModuleMap) => modules.backdrop,
    scopes: ['channel:read:redemptions'],
}
