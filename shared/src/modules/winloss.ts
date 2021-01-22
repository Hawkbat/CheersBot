import { Icon, ChannelData, ModuleVersion } from '../'
import { ModuleStateData, ModuleConfigData, Module } from './common'

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
}

export const WinLossModule: Module<WinLossStateData, WinLossConfigData> = {
    name: 'Win/Loss Record',
    description: 'Allows channels to track game wins, losses, and deaths for a stream and display them in the overlay.',
    version: ModuleVersion.beta,
    getData: (data: ChannelData) => data.modules.winLoss,
}
