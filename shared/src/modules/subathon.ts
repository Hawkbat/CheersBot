import { Icon, ModuleVersion } from '../data'
import { ModuleStateData, ModuleConfigData, Module, ModuleMap } from './common'

export interface SubathonTriggerConfig {
    id: string
    type: 'sub' | 'bits' | 'reward'
    redeemID: string
    redeemName: string
    baseDuration: number
    scaledDuration: number
}

export interface SubathonStateData extends ModuleStateData {
    active: boolean
    running: boolean
    startTime: number | null
    remainingTime: number
    elapsedTime: number
    subCount: number
    bitCount: number
    pointCount: number
}

export interface SubathonConfigData extends ModuleConfigData {
    icon: Icon | null
    startText: string
    runningText: string
    endText: string
    duration: number
    type: 'reset' | 'extend'
    triggers: SubathonTriggerConfig[]
}

export const SubathonModule: Module<SubathonStateData, SubathonConfigData> = {
    name: 'Subathon Timer',
    description: 'Manages a timer for subathons that either resets or has time added when users subscribe.',
    version: ModuleVersion.preAlpha,
    getData: (modules: ModuleMap) => modules.subathon,
    scopes: ['channel:read:subscriptions', 'bits:read', 'channel:read:redemptions'],
}
