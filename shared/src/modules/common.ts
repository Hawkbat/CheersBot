import { ModuleVersion } from '../data'
import { BackdropModule } from './backdrop'
import { ChannelInfoModule } from './channelinfo'
import { CountersModule } from './counters'
import { CustomMessageModule } from './custommessage'
import { DebugModule } from './debug'
import { EventQueueModule } from './eventqueue'
import { EvilDmModule } from './evildm'
import { HeadpatsModule } from './headpat'
import { ModeQueueModule } from './modequeue'
import { SoundsModule } from './sounds'
import { UserQueueModule } from './userqueue'
import { VodQueueModule } from './vodqueue'
import { VTubeStudioModule } from './vtstudio'
import { WinLossModule } from './winloss'

export interface ModuleStateData {

}

export interface ModuleConfigData {
    enabled: boolean
}

export interface ModuleData<State extends ModuleStateData = ModuleStateData, Config extends ModuleConfigData = ModuleConfigData> {
    state: State
    config: Config
}

export interface Module<State extends ModuleStateData = ModuleStateData, Config extends ModuleConfigData = ModuleConfigData> {
    name: string
    description: string
    version: ModuleVersion

    getData: (modules: ModuleMap) => ModuleData<State, Config>
}

export const MODULES = {
    headpats: HeadpatsModule,
    evilDm: EvilDmModule,
    modeQueue: ModeQueueModule,
    winLoss: WinLossModule,
    userQueue: UserQueueModule,
    backdrop: BackdropModule,
    vodQueue: VodQueueModule,
    customMessage: CustomMessageModule,
    counters: CountersModule,
    sounds: SoundsModule,
    vtubeStudio: VTubeStudioModule,
    eventQueue: EventQueueModule,
    channelInfo: ChannelInfoModule,
    debug: DebugModule,
}

export type ModuleType = keyof typeof MODULES

export type ModuleDataType<T extends ModuleType> = ReturnType<typeof MODULES[T]['getData']>

export const MODULE_TYPES = Object.keys(MODULES) as ModuleType[]

export function getModule<T extends ModuleType>(type: T): typeof MODULES[T] {
    return MODULES[type]
}

export type ModuleMap = { [key in ModuleType]: ModuleDataType<key> }
