import { Icon, ModuleVersion } from '../data'
import { ModuleStateData, ModuleConfigData, Module, ModuleMap, TriggerConfig } from './common'

export interface SoundRedeem {
    id: string
    configID: string
    userID: string
    userName: string
    redeemTime: number
}

export interface SoundConfig extends TriggerConfig {
    emote: Icon | null
    showUsername: boolean
    displayName: string
    volume: number
    type: 'one' | 'any' | 'weighted-any'
    fileName: string | null
    sounds?: { fileName: string | null, weight?: number }[]
    blocking?: boolean
}

export interface SoundsStateData extends ModuleStateData {
    sounds: SoundRedeem[]
}

export interface SoundsConfigData extends ModuleConfigData {
    sounds: SoundConfig[]
    uploads: string[]
}

export const SoundsModule: Module<SoundsStateData, SoundsConfigData> = {
    name: 'Sounds',
    description: 'Plays sounds through the overlay when certain channel point rewards are redeemed.',
    version: ModuleVersion.beta,
    getData: (modules: ModuleMap) => modules.sounds,
    scopes: ['channel:read:redemptions'],
}
