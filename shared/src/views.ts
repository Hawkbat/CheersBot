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

export interface MessageMeta {
    id: string
    username: string
    channel: string
}

export interface SocketMessage<K extends keyof (ChannelClientMessages & ChannelServerMessages & GlobalServerMessages & GlobalClientMessages), V> {
    type: K
    meta: MessageMeta
    args: (ChannelClientMessages & ChannelServerMessages & GlobalServerMessages & GlobalClientMessages)[K]
}

export interface ChannelActions {
    'headpats/adjust': (args: { delta: number }, msg: MessageMeta) => boolean
    'evildm/adjust': (args: { delta: number }, msg: MessageMeta) => boolean
    'modequeue/start': (args: { id: string, duration: number }, msg: MessageMeta) => boolean
    'modequeue/clear': (args: { id: string }, msg: MessageMeta) => boolean
    'backdrop/fire-cannon': (args: { text: string }, msg: MessageMeta) => boolean
    'backdrop/swap-camera': (args: { name: string }, msg: MessageMeta) => boolean
    'debug/mock': (args: { type: RedeemType, username: string, message: string, amount: number }, msg: MessageMeta) => boolean
    'debug/reload': (args: {}, msg: MessageMeta) => boolean
    'config/enable-module': (args: { type: ModuleType, enabled: boolean }, msg: MessageMeta) => boolean
    'access/set': (args: { type: AccountType, id: string, access: Access }, msg: MessageMeta) => boolean
}

export interface ChannelViews {
    'controlpanel': (msg: MessageMeta) => ControlPanelViewData
    'overlay': (msg: MessageMeta) => OverlayViewData
}

export interface ChannelServerMessages {
    'backdrop/fire-cannon': (args: { text: string }, msg: MessageMeta) => void
    'backdrop/swap-camera': (args: { name: string }, msg: MessageMeta) => void
}

export interface ChannelClientMessages {

}

export interface GlobalActions {
    'access/request': (args: { channel: string }, msg: MessageMeta) => boolean
    'access/set': (args: { type: AccountType, id: string, access: Access }, msg: MessageMeta) => boolean
}

export interface GlobalViews {
    'landing': (msg: MessageMeta) => LandingViewData
}

export interface GlobalServerMessages {

}

export interface GlobalClientMessages {

}
