import { Icon, ModuleVersion } from '../'
import { ModuleStateData, ModuleConfigData, Module, ModuleMap } from './common'

export interface SoundRedeem {
    id: string
    configID: string
    userID: string
    userName: string
    redeemTime: number
}

export interface SoundConfig {
    id: string
    redeemID: string
    redeemName: string
    emote: Icon | null
    showUsername: boolean
    displayName: string
    volume: number
    fileName: string
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
}
