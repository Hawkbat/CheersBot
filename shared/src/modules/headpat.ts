import { Icon, ChannelData, ModuleVersion } from '../'
import { ModuleStateData, ModuleConfigData, Module } from './common'

export interface HeadpatStateData extends ModuleStateData {
    count: number
    streak: number
}

export interface HeadpatConfigData extends ModuleConfigData {
    emote: Icon | null
}

export const HeadpatsModule: Module<HeadpatStateData, HeadpatConfigData> = {
    name: 'Headpats',
    description: 'Keeps an overlay counter of how many times a certain channel point reward is redeemed.',
    version: ModuleVersion.girldm,
    getData: (data: ChannelData) => data.modules.headpats,
}
