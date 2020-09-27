import { RedeemType, Icon, RedeemModeDisplay, ChannelData, AccountType, Access, UserData } from './data'
import { ModuleType, ModeQueueModeConfig } from './modules'

export interface BaseViewData {
    meta: MessageMeta
    refreshTime: number
    isGirlDm: boolean
}

export interface GlobalBaseViewData extends BaseViewData {

}

export interface ChannelBaseViewData extends BaseViewData {
    channel: string
}

export interface AccessDeniedViewData extends ChannelBaseViewData {

}

export interface AuthorizeViewData extends GlobalBaseViewData {
    accountType: AccountType
}

export interface ChannelViewData extends ChannelBaseViewData {

}

export interface LandingViewData extends GlobalBaseViewData {

}

export interface MessageViewData extends GlobalBaseViewData {
    message: string
    redirect?: string
}

export interface OverlayViewData extends ChannelBaseViewData {

}

export interface PanelViewData {
    type: ModuleType
    open: boolean
}

export interface ControlPanelAppViewData extends ChannelBaseViewData {
    username: string
    channel: string
    channelData: ChannelData
    channels: string[]
    icons: Icon[]
    panels: PanelViewData[]
    updateTime: Date
}

export interface OverlayAppViewData extends ChannelBaseViewData {
    channel: string
    channelData: ChannelData
    modes: RedeemModeDisplay[]
}

export interface LandingAppViewData extends GlobalBaseViewData {
    username: string
    userData: UserData | null
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
    url: string
}

export interface SocketMessage<K extends keyof (ChannelClientMessages & ChannelServerMessages & GlobalServerMessages & GlobalClientMessages), V> {
    type: K
    meta: MessageMeta
    args: (ChannelClientMessages & ChannelServerMessages & GlobalServerMessages & GlobalClientMessages)[K]
}

export interface ChannelActions {
    'headpats/adjust': (args: { delta: number }, msg: MessageMeta) => boolean
    'headpats/set-emote': (args: { emote: Icon | null }, msg: MessageMeta) => boolean
    'evildm/adjust': (args: { delta: number }, msg: MessageMeta) => boolean
    'evildm/set-emote': (args: { emote: Icon | null }, msg: MessageMeta) => boolean
    'modequeue/start': (args: { id: string, duration: number }, msg: MessageMeta) => boolean
    'modequeue/clear': (args: { id: string }, msg: MessageMeta) => boolean
    'modequeue/add-mode': (args: Partial<ModeQueueModeConfig>, msg: MessageMeta) => boolean
    'modequeue/edit-mode': (args: { id: string } & Partial<ModeQueueModeConfig>, msg: MessageMeta) => boolean
    'modequeue/delete-mode': (args: { id: string }, msg: MessageMeta) => boolean
    'winloss/set-displayed': (args: { display: boolean }, msg: MessageMeta) => boolean
    'winloss/adjust-wins': (args: { delta: number }, msg: MessageMeta) => boolean
    'winloss/adjust-losses': (args: { delta: number }, msg: MessageMeta) => boolean
    'winloss/adjust-draws': (args: { delta: number }, msg: MessageMeta) => boolean
    'winloss/adjust-deaths': (args: { delta: number }, msg: MessageMeta) => boolean
    'winloss/clear': (args: {}, msg: MessageMeta) => boolean
    'winloss/set-winning-emote': (args: { emote: Icon | null }, msg: MessageMeta) => boolean
    'winloss/set-losing-emote': (args: { emote: Icon | null }, msg: MessageMeta) => boolean
    'winloss/set-tied-emote': (args: { emote: Icon | null }, msg: MessageMeta) => boolean
    'winloss/set-death-emote': (args: { emote: Icon | null }, msg: MessageMeta) => boolean
    'backdrop/fire-cannon': (args: { text: string }, msg: MessageMeta) => boolean
    'backdrop/swap-camera': (args: { name: string }, msg: MessageMeta) => boolean
    'channelinfo/set-accent-color': (args: { color: string }, msg: MessageMeta) => boolean
    'channelinfo/set-muted-color': (args: { color: string }, msg: MessageMeta) => boolean
    'debug/mock': (args: { configID: string, username: string, message: string, amount: number }, msg: MessageMeta) => boolean
    'debug/reload': (args: {}, msg: MessageMeta) => boolean
    'config/enable-module': (args: { type: ModuleType, enabled: boolean }, msg: MessageMeta) => boolean
    'access/set': (args: { type: AccountType, id: string, access: Access }, msg: MessageMeta) => boolean
}

export interface ChannelViews {
    'access-denied': (args: Omit<AccessDeniedViewData, keyof ChannelBaseViewData>, msg: MessageMeta) => AccessDeniedViewData
    'channel': (args: Omit<ChannelViewData, keyof ChannelBaseViewData>, msg: MessageMeta) => ChannelViewData
    'overlay': (args: Omit<OverlayViewData, keyof ChannelBaseViewData>, msg: MessageMeta) => OverlayViewData
    'controlpanel-app': (args: Omit<ControlPanelAppViewData, keyof ChannelBaseViewData>, msg: MessageMeta) => ControlPanelAppViewData
    'overlay-app': (args: Omit<OverlayAppViewData, keyof ChannelBaseViewData>, msg: MessageMeta) => OverlayAppViewData
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
    'authorize': (args: Omit<AuthorizeViewData, keyof GlobalBaseViewData>, msg: MessageMeta) => AuthorizeViewData
    'landing': (args: Omit<LandingViewData, keyof GlobalBaseViewData>, msg: MessageMeta) => LandingViewData
    'message': (args: Omit<MessageViewData, keyof GlobalBaseViewData>, msg: MessageMeta) => MessageViewData
    'landing-app': (args: Omit<LandingAppViewData, keyof GlobalBaseViewData>, msg: MessageMeta) => LandingAppViewData
}

export interface GlobalServerMessages {

}

export interface GlobalClientMessages {

}
