import { Icon, ModuleVersion } from '../data'
import { ModuleStateData, ModuleConfigData, Module, ModuleMap } from './common'

export interface CounterConfig {
    id: string
    redeemID: string
    redeemName: string
    emote: Icon | null
    message: string
    visibility: CounterVisibility
    duration: number
    maximum: number | null
}

export enum CounterVisibility {
    always = 'Always',
    nonZero = 'Non-Zero Count',
    whenRedeemed = 'When Redeemed',
    never = 'Never',
}

export interface Counter {
    count: number
    time?: number
}

export interface CountersStateData extends ModuleStateData {
    counters: { [key: string]: Counter | undefined }
}

export interface CountersConfigData extends ModuleConfigData {
    configs: CounterConfig[]
}

export const CountersModule: Module<CountersStateData, CountersConfigData> = {
    name: 'Redemption Counters',
    description: 'Tracks the number of times certain channel point rewards are redeemed.',
    version: ModuleVersion.released,
    getData: (modules: ModuleMap) => modules.counters,
}
