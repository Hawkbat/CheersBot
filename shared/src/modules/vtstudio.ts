import { Icon, ModuleVersion } from '../data'
import { ModuleStateData, ModuleConfigData, Module, ModuleMap, TriggerConfig } from './common'

export interface ModelSwapConfig extends TriggerConfig {
    emote: Icon | null
    showUsername: boolean
    message: string
    duration: number
    type: 'one' | 'any' | 'weighted-any'
    models: { id: string, name: string, weight?: number, position?: { positionX: number, positionY: number, rotation: number, size: number } | null }[]
    after?: 'revert' | 'config' | 'nothing'
    afterConfig?: string
    revertDelay?: number | null
}

export interface TriggerHotkeyConfig extends TriggerConfig {
    emote: Icon | null
    showUsername: boolean
    message: string
    duration: number
    type: 'one' | 'any' | 'weighted-any' | 'all'
    hotkeys: { id: string, name: string, weight?: number }[]
    after?: 'retrigger' | 'config' | 'nothing'
    afterConfig?: string
    retriggerDelay?: number | null
}

export interface ColorTintConfig extends TriggerConfig {
    emote: Icon | null
    showUsername: boolean
    message: string
    duration: number
    type: 'all' | 'match' | 'rainbow'
    color: { r: number, g: number, b: number, a: number }
    matches: {
        color: { r: number, g: number, b: number, a: number }
        names: string[]
        tags: string[]
    }[]
    rainbowSpeed: number
    after?: 'reset' | 'config' | 'nothing'
    afterConfig?: string
    resetDelay?: number | null
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

export interface ColorTintState {
    id: string
    configID: string
    userID: string
    userName: string
    redeemTime: number
}

export interface VTubeStudioStateData extends ModuleStateData {
    swaps: ModelSwapState[]
    triggers: HotkeyTriggerState[]
    tints: ColorTintState[]
    status: { time: number, connected: boolean, apiError: string, readyState: number }
}

export interface VTubeStudioConfigData extends ModuleConfigData {
    apiHost: string
    apiPort: number
    apiSecure: boolean
    swaps: ModelSwapConfig[]
    triggers: TriggerHotkeyConfig[]
    tints: ColorTintConfig[]
    useOverlay: boolean
    debugOverlay: boolean
}

export const VTubeStudioModule: Module<VTubeStudioStateData, VTubeStudioConfigData> = {
    name: 'VTube Studio',
    description: 'Allows channel point redemptions to trigger effects in VTube Studio.',
    version: ModuleVersion.beta,
    getData: (modules: ModuleMap) => modules.vtubeStudio,
    scopes: ['channel:read:redemptions'],
}
