import { RedeemMode, UserQueueEntry, UserQueueRound, ChannelData } from './data'

export interface ModuleData {
    enabled: boolean
}

export interface Module<T extends ModuleData = ModuleData> {
    name: string
    description: string

    getData: (data: ChannelData) => T
}

export interface HeadpatData extends ModuleData {
    count: number
    streak: number
}

export const HeadpatsModule: Module<HeadpatData> = {
    name: 'Headpats',
    description: 'For Girl_Dm_! Keeps an overlay counter of how many times a certain channel point reward is redeemed.',
    getData: (data: ChannelData) => data.modules.headpats,
}

export interface EvilDmData extends ModuleData {
    count: number
    time: number
}

export const EvilDmModule: Module<EvilDmData> = {
    name: 'Evil DM',
    description: 'For Girl_Dm_! Keeps an overlay counter of how many times a certain channel point reward is redeemed with certain keywords in the message.',
    getData: (data: ChannelData) => data.modules.evilDm,
}

export interface ModeQueueData extends ModuleData {
    modes: RedeemMode[]
}

export const ModeQueueModule: Module<ModeQueueData> = {
    name: 'Mode Queue',
    description: 'For Girl_Dm_! Displays timers in the overlay when certain channel point rewards are redeemed.',
    getData: (data: ChannelData) => data.modules.modeQueue,
}

export interface UserQueueData extends ModuleData {
    acceptEntries: boolean
    entries: UserQueueEntry[]
    rounds: UserQueueRound[]
}

export const UserQueueModule: Module<UserQueueData> = {
    name: 'User Queue',
    description: '--ALPHA-- Allows Twitch chat to submit entries into a queue the streamer can then draw from. Could be used for raffles, viewer game drafting, and similar events.',
    getData: (data: ChannelData) => data.modules.userQueue,
}

export interface ChannelInfoData extends ModuleData {

}

export const ChannelInfoModule: Module<ChannelInfoData> = {
    name: 'User and Channel',
    description: 'Displays information about the current user and channel. Don\'t disable unless you know what you\'re doing!',
    getData: (data: ChannelData) => data.modules.channelInfo,
}

export interface DebugData extends ModuleData {

}

export const DebugModule: Module<DebugData> = {
    name: 'Debug',
    description: 'Provides information and tools for testing and debugging the control panel. Don\'t enable unless you know what you\'re doing!',
    getData: (data: ChannelData) => data.modules.debug,
}

export const MODULES = {
    headpats: HeadpatsModule,
    evilDm: EvilDmModule,
    modeQueue: ModeQueueModule,
    userQueue: UserQueueModule,
    channelInfo: ChannelInfoModule,
    debug: DebugModule,
}

export type ModuleType = keyof typeof MODULES

export type ModuleDataType<T extends ModuleType> = ReturnType<typeof MODULES[T]['getData']>

export const MODULE_TYPES = Object.keys(MODULES) as ModuleType[]

export function getModule<T extends ModuleType>(type: T): typeof MODULES[T] {
    return MODULES[type]
}
