import { Icon, ChannelData, ModuleVersion } from '../'
import { ModuleStateData, ModuleConfigData, Module } from './common'

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
    redeemName: string
    emote: Icon | null
    showUsername: boolean
    startText: string
    runningText: string
    endText: string
    duration: number
}

export interface ModeQueueConfigData extends ModuleConfigData {
    modes: ModeQueueModeConfig[]
}

export const ModeQueueModule: Module<ModeQueueStateData, ModeQueueConfigData> = {
    name: 'Mode Queue',
    description: 'Displays "modes" in the overlay that can be controlled with timers, when certain channel point rewards are redeemed.',
    version: ModuleVersion.released,
    getData: (data: ChannelData) => data.modules.modeQueue,
}
