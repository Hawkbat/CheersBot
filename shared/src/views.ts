import { AccessMap, IconMap, TwitchReward } from './data'
import { Icon, AccountType, Access, Changelog } from './data'
import { ModuleType, ModeQueueModeConfig, VodQueueConfigData, RedeemModeDisplay, CustomMessage, CounterConfig, Counter, ModuleDataType, SoundConfig, ChannelInfoConfigData } from './modules'

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
    items?: { [key: string]: boolean }
}

export interface ControlPanelAppViewData extends ChannelBaseViewData {
    username: string
    modules: { [key in ModuleType]: ModuleDataType<key> }
    userAccess: AccessMap
    botAccess: AccessMap
    channels: string[]
    panels: ModuleType[]
    changelog: Changelog
}

export interface OverlayAppViewData extends ChannelBaseViewData {
    modules: { [key in ModuleType]: ModuleDataType<key> }
}

export interface LandingAppViewData extends GlobalBaseViewData {
    username: string
    channelAccess: AccessMap | null
    changelog: Changelog
}

export interface PanelViewDataProps {
    page: ControlPanelPage
    panel: PanelViewData
    onToggleItem: (id: string, open: boolean) => void
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
    'modequeue/set-alarm-volume': (args: { volume: number }, msg: MessageMeta) => boolean
    'modequeue/mock': (args: { configID: string, username: string }) => boolean
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
    'vodqueue/set-config': (args: Partial<VodQueueConfigData>, msg: MessageMeta) => boolean
    'vodqueue/delete-entry': (args: { id: string }, msg: MessageMeta) => boolean
    'vodqueue/mock': (args: {}, msg: MessageMeta) => boolean
    'custommessage/add-message': (args: Partial<CustomMessage>, msg: MessageMeta) => boolean
    'custommessage/edit-message': (args: { id: string } & Partial<CustomMessage>, msg: MessageMeta) => boolean
    'custommessage/delete-message': (args: { id: string }, msg: MessageMeta) => boolean
    'counters/set-count': (args: { id: string } & Counter, msg: MessageMeta) => boolean
    'counters/add-config': (args: Partial<CounterConfig>, msg: MessageMeta) => boolean
    'counters/edit-config': (args: { id: string } & Partial<CounterConfig>, msg: MessageMeta) => boolean
    'counters/delete-config': (args: { id: string }, msg: MessageMeta) => boolean
    'sounds/remove-redeem': (args: { id: string }, msg: MessageMeta) => boolean
    'sounds/add-config': (args: Partial<SoundConfig>, msg: MessageMeta) => boolean
    'sounds/edit-config': (args: { id: string } & Partial<SoundConfig>, msg: MessageMeta) => boolean
    'sounds/delete-config': (args: { id: string }, msg: MessageMeta) => boolean
    'sounds/upload': (args: { fileName: string, data: string }, msg: MessageMeta) => boolean
    'sounds/mock': (args: { configID: string, username: string }, msg: MessageMeta) => boolean
    'channelinfo/set-config': (args: Partial<ChannelInfoConfigData>, msg: MessageMeta) => boolean
    'channelinfo/get-icons': (args: {}, msg: MessageMeta) => IconMap
    'tts/speak': (args: { voice: string, text: string, style: string, pitch: number }, msg: MessageMeta) => Promise<string>
    'twitch/rewards': (args: {}, msg: MessageMeta) => Promise<TwitchReward[]>
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
