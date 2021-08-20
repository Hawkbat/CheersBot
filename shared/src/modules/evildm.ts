import { Icon, ModuleVersion } from '../data'
import { ModuleStateData, ModuleConfigData, Module, ModuleMap } from './common'

export interface EvilDmStateData extends ModuleStateData {
    count: number
    time: number
}

export interface EvilDmConfigData extends ModuleConfigData {
    emote: Icon | null
}

export const EvilDmModule: Module<EvilDmStateData, EvilDmConfigData> = {
    name: 'Evil DM',
    description: 'Keeps an overlay counter of how many times a certain channel point reward is redeemed with certain keywords in the message.',
    version: ModuleVersion.girldm,
    getData: (modules: ModuleMap) => modules.evilDm,
    scopes: ['channel:read:redemptions'],
}
