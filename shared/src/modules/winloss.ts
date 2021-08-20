import { Icon, ModuleVersion } from '../data'
import { ModuleStateData, ModuleConfigData, Module, ModuleMap } from './common'

export interface WinLossStateData extends ModuleStateData {
    display: boolean
    wins: number
    losses: number
    draws: number
    deaths: number
    deathTime: number
}

export interface WinLossConfigData extends ModuleConfigData {
    winningEmote: Icon | null
    tiedEmote: Icon | null
    losingEmote: Icon | null
    deathEmote: Icon | null
    deathDuration: number
}

export const WinLossModule: Module<WinLossStateData, WinLossConfigData> = {
    name: 'Win/Loss Record',
    description: 'Allows channels to track game wins, losses, and deaths for a stream and display them in the overlay.',
    version: ModuleVersion.preRelease,
    getData: (modules: ModuleMap) => modules.winLoss,
    scopes: [],
}
