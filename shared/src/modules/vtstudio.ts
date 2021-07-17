import { Icon, ModuleVersion } from '../data'
import { ModuleStateData, ModuleConfigData, Module, ModuleMap } from './common'

export interface ModelSwapConfig {
    id: string
    redeemID: string
    redeemName: string
    emote: Icon | null
    showUsername: boolean
    message: string
    duration: number
    type: 'one' | 'any' | 'weighted-any'
    models: { id: string, name: string, weight?: number }[]
    after?: 'revert' | 'nothing'
    revertDelay?: number | null
}

export interface TriggerHotkeyConfig {
    id: string
    redeemID: string
    redeemName: string
    emote: Icon | null
    showUsername: boolean
    message: string
    duration: number
    type: 'one' | 'any' | 'weighted-any' | 'all'
    hotkeys: { id: string, name: string, weight?: number }[]
    after?: 'retrigger' | 'nothing'
    retriggerDelay?: number | null
}

export interface ModelSwapState {
    id: string
    configID: string
    userID: string
    userName: string
    redeemTime: number
}

export interface HotkeyTriggerState {
    id: string
    configID: string
    userID: string
    userName: string
    redeemTime: number
}

export interface VTubeStudioStateData extends ModuleStateData {
    swaps: ModelSwapState[]
    triggers: HotkeyTriggerState[]
}

export interface VTubeStudioConfigData extends ModuleConfigData {
    apiHost: string
    apiPort: number
    apiSecure: boolean
    swaps: ModelSwapConfig[]
    triggers: TriggerHotkeyConfig[]
}

export const VTubeStudioModule: Module<VTubeStudioStateData, VTubeStudioConfigData> = {
    name: 'VTube Studio',
    description: 'Allows channel point redemptions to trigger effects in VTube Studio.',
    version: ModuleVersion.beta,
    getData: (modules: ModuleMap) => modules.vtubeStudio,
}
