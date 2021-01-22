import { ModuleType, ModuleDataType } from './modules'

export enum AccountType {
    bot = 'bot',
    channel = 'channel',
    user = 'user',
}

export interface Token {
    accessToken: string
    refreshToken: string
    scope: string[]
}

export interface AccountData {
    token: Token
}

export interface BotData extends AccountData {
    channels: { [key: string]: Access }
}

export interface ChannelData extends AccountData {
    bots: { [key: string]: Access }
    users: { [key: string]: Access }
    modules: { [key in ModuleType]: ModuleDataType<key> }
}

export interface UserData extends AccountData {
    channels: { [key: string]: Access }
}

export enum Access {
    pending = 'pending',
    denied = 'denied',
    approved = 'approved',
}

export interface Icon {
    type: 'emote' | 'badge' | 'ffz' | 'bttv' | 'logo'
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
