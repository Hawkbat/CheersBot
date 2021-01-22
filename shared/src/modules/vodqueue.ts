import { ChannelData, ModuleVersion } from '../'
import { ModuleStateData, ModuleConfigData, Module } from './common'

export enum VodQueueGame {
    generic = 'Generic',
    overwatch = 'Overwatch',
}

export interface VodQueueEntry {
    id: string
    user: {
        id: string
        name: string
    }
    time: number
    context: string
}

export interface VodQueueStateData extends ModuleStateData {
    entries: VodQueueEntry[]
    patchDate: string
}

export interface VodQueueConfigData extends ModuleConfigData {
    redeemName: string
    game: VodQueueGame
}

export const VodQueueModule: Module<VodQueueStateData, VodQueueConfigData> = {
    name: 'VOD Queue',
    description: 'Allows channels to track VOD review requests and automatically invalidate them when new patches come out. Games currently supported: Any (Generic), Overwatch',
    version: ModuleVersion.beta,
    getData: (data: ChannelData) => data.modules.vodQueue,
}