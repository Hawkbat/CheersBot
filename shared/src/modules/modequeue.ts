import { Icon, ModuleVersion } from '../data'
import { ModuleStateData, ModuleConfigData, Module, ModuleMap } from './common'

export interface RedeemMode {
    id: string
    configID: string
    userID: string
    userName: string
    message: string
    amount: number
    redeemTime: number
    visible: boolean
    startTime?: number
    duration?: number
}

export interface RedeemModeDisplay extends RedeemMode {
    icon: Icon
    showName: boolean
    msg: string
}

export interface ModeQueueStateData extends ModuleStateData {
    modes: RedeemMode[]
}

export interface ModeQueueModeConfig {
    id: string
    redeemID: string
    redeemName: string
    emote: Icon | null
    showUsername: boolean
    startText: string
    runningText: string
    endText: string
    duration: number
    autoStart?: boolean
    autoEnd?: boolean
}

export interface ModeQueueConfigData extends ModuleConfigData {
    modes: ModeQueueModeConfig[]
    alarmVolume?: number
}

export const ModeQueueModule: Module<ModeQueueStateData, ModeQueueConfigData> = {
    name: 'Mode Queue',
    description: 'Displays "modes" in the overlay that can be controlled with timers, when certain channel point rewards are redeemed.',
    version: ModuleVersion.released,
    getData: (modules: ModuleMap) => modules.modeQueue,
}
