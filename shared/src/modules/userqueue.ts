import { ModuleVersion } from '../data'
import { ModuleStateData, ModuleConfigData, Module, ModuleMap } from './common'

export interface UserQueueEntry {
    id: string
    user: {
        id: string
        name: string
    }
    rounds: string[]
    time: number
    context: string
}

export interface UserQueueRound {
    id: string
    entries: string[]
    time: number
    context: string
}

export interface UserQueueStateData extends ModuleStateData {
    acceptEntries: boolean
    entries: UserQueueEntry[]
    rounds: UserQueueRound[]
}

export interface UserQueueConfigData extends ModuleConfigData {

}

export const UserQueueModule: Module<UserQueueStateData, UserQueueConfigData> = {
    name: 'User Queue',
    description: 'Allows Twitch chat to submit entries into a queue the streamer can then draw from. Could be used for raffles, viewer game drafting, and similar events.',
    version: ModuleVersion.preAlpha,
    getData: (modules: ModuleMap) => modules.userQueue,
}
