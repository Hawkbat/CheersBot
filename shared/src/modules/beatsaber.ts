import { ModuleVersion } from '../data'
import { ModuleStateData, ModuleConfigData, Module, ModuleMap } from './common'

export const BSDataPullerUrl = 'localhost'
export const BSDataPullerPort = 2946
export const BSDataPullerMapDataSuffix = '/BSDataPuller/MapData'
export const BSDataPullerLiveDataSuffix = '/BSDataPuller/LiveData'

export interface BSDataPullerMapData {
    GameVersion: `${number}.${number}.${number}`
    PluginVersion: `${number}.${number}.${number}.${number}`
    InLevel: boolean
    LevelPaused: boolean
    LevelFinished: boolean
    LevelFailed: boolean
    LevelQuit: boolean
    Hash: string
    SongName: string
    SongSubName: string
    SongAuthor: string
    Mapper: string
    BSRKey: string
    coverImage: string
    Length: number
    TimeScale: number
    MapType: string
    Difficulty: string
    CustomDifficultyLabel: string
    BPM: number
    NJS: number
    Modifiers: Record<string, boolean>
    ModifiersMultiplier: number
    PracticeMode: boolean
    PracticeModeModifiers: Record<string, number>
    PP: number
    Star: number
    IsMultiplayer: boolean
    PreviousRecord: number
    PreviousBSR: string | null
}

export interface BSDataPullerLiveData {
    Score: number
    ScoreWithMultipliers: number
    MaxScore: number
    MaxScoreWithMultipliers: number
    Rank: string
    FullCombo: boolean
    Combo: number
    Misses: number
    Accuracy: number
    BlockHitScore: number[]
    PlayerHealth: number
    TimeElapsed: number
}

export interface BeatsaberStateData extends ModuleStateData {

}

export interface BeatsaberConfigData extends ModuleConfigData {
    debugOverlay: boolean
    apiHost: string
    apiPort: number
}

export const BeatsaberModule: Module<BeatsaberStateData, BeatsaberConfigData> = {
    name: 'Beat Saber',
    description: 'Displays information about the currently playing song in Beat Saber.',
    version: ModuleVersion.alpha,
    getData: (modules: ModuleMap) => modules.beatsaber,
    scopes: [],
}
