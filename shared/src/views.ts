import { RedeemType, Icon, RedeemModeDisplay, ChannelData, AccountType, Access, UserData } from './data'
import { ModuleType } from './modules'

export interface PanelViewData {
    type: ModuleType
    open: boolean
}

export interface ControlPanelViewData {
    username: string
    channel: string
    channelData: ChannelData
    channels: string[]
    redeemTypes: { [key: string]: RedeemType }
    icons: Icon[]
    panels: PanelViewData[]
    updateTime: Date
    refreshTime: number
}

export interface OverlayViewData {
    channel: string
    channelData: ChannelData
    modes: RedeemModeDisplay[]
    refreshTime: number
}

export interface LandingViewData {
    username: string
    userData: UserData | null
    refreshTime: number
}

export enum ControlPanelPage {
    view = 'Control Panel',
    edit = 'Configuration',
    access = 'User Access',
}

export interface ChannelActions {
    'adjust-headpats': (args: { delta: number }, username: string) => boolean
    'adjust-evil': (args: { delta: number }, username: string) => boolean
    'start-event': (args: { id: string, duration: number }, username: string) => boolean
    'clear-event': (args: { id: string }, username: string) => boolean
    'mock-event': (args: { type: RedeemType, username: string, message: string, amount: number }, username: string) => boolean
    'reload': (args: {}, username: string) => boolean
    'toggle-module': (args: { type: ModuleType, enabled: boolean }, username: string) => boolean
    'set-access': (args: { type: AccountType, id: string, access: Access }, username: string) => boolean
}

export interface ChannelViews {
    'controlpanel': (username: string) => ControlPanelViewData
    'overlay': (username: string) => OverlayViewData
}

export interface GlobalActions {
    'request-access': (args: { channel: string }, username: string) => boolean
    'set-access': (args: { type: AccountType, id: string, access: Access }, username: string) => boolean
}

export interface GlobalViews {
    'landing': (username: string) => LandingViewData
}
