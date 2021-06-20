
export enum AccountType {
    bot = 'bot',
    channel = 'channel',
    user = 'user',
}

export enum Access {
    pending = 'pending',
    denied = 'denied',
    approved = 'approved',
}

export interface AccessMap {
    [key: string]: Access
}

export interface Icon {
    type: 'emote' | 'badge' | 'ffz' | 'bttv' | 'discord' | 'logo' | 'fa-brand'
    id: string
    name: string
}

export interface IconMap {
    [key: string]: Icon[]
}

export interface TtsMessage {
    id: string
    text: string
    voice: string
    style: string
    pitch: number
}

export interface TwitchReward {
    id: string
    name: string
}

export interface Changelog {
    changelog: ChangelogVersion[]
}

export interface ChangelogVersion {
    version: string
    released: string
    changes: string[]
}

export enum ModuleVersion {
    released = '',
    preAlpha = 'PRE-ALPHA',
    alpha = 'ALPHA',
    beta = 'BETA',
    girldm = 'GIRLDM ONLY',
    deprecated = 'DEPRECATED',
}

export const VERSION_TOOLTIPS: { [key in ModuleVersion]: string } = {
    [ModuleVersion.released]: '',
    [ModuleVersion.preAlpha]: 'Functionality is in development and not ready for streamer use.',
    [ModuleVersion.alpha]: 'Functionality is in development and available for testing offline.',
    [ModuleVersion.beta]: 'Functionality is ready for live testing but may have bugs or minor changes.',
    [ModuleVersion.girldm]: 'Only available on the girl_dm_ channel; it will not function elsewhere!',
    [ModuleVersion.deprecated]: 'Functionality is superceded by another module and will not be updated.',
}
