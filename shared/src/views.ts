import { AccessMap, IconMap, TwitchReward } from './data'
import { Icon, AccountType, Access, Changelog } from './data'
import { LogMessage } from './logging'
import { ModuleType, ModeQueueModeConfig, VodQueueConfigData, CustomMessage, CounterConfig, Counter, ModuleDataType, SoundConfig, ChannelInfoConfigData, ModelSwapConfig, TriggerHotkeyConfig, VTubeStudioConfigData, WinLossConfigData, ColorTintConfig, VTubeStudioStateData, DebugConfigData, SubathonConfigData, SubathonTriggerConfig } from './modules'

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
    authToken: string
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
    tokenScopes: string[]
    channels: string[]
    panels: ModuleType[]
    changelog: Changelog
}

export interface OverlayAppViewData extends ChannelBaseViewData {
    modules: { [key in ModuleType]: ModuleDataType<key> }
}

export interface LandingAppViewData extends GlobalBaseViewData {
    username: string
    userChannelAccess: AccessMap | null
    botChannelAccess: AccessMap | null
    channels: string[]
    changelog: Changelog
    streams: { channel: string, game: string, viewCount: number }[]
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
    'winloss/set-config': (args: Partial<WinLossConfigData>, msg: MessageMeta) => boolean
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
    'sounds/add-upload': (args: { fileName: string, data: string }, msg: MessageMeta) => Promise<boolean>
    'sounds/delete-upload': (args: { fileName: string }, msg: MessageMeta) => Promise<boolean>
    'sounds/mock': (args: { configID: string, username: string }, msg: MessageMeta) => boolean
    'vtstudio/complete-model-swap': (args: { id: string }, msg: MessageMeta) => boolean
    'vtstudio/add-model-swap': (args: Partial<ModelSwapConfig>, msg: MessageMeta) => boolean
    'vtstudio/edit-model-swap': (args: { id: string } & Partial<ModelSwapConfig>, msg: MessageMeta) => boolean
    'vtstudio/delete-model-swap': (args: { id: string }, msg: MessageMeta) => boolean
    'vtstudio/mock-model-swap': (args: { configID: string }, msg: MessageMeta) => boolean
    'vtstudio/complete-hotkey-trigger': (args: { id: string }, msg: MessageMeta) => boolean
    'vtstudio/add-hotkey-trigger': (args: Partial<TriggerHotkeyConfig>, msg: MessageMeta) => boolean
    'vtstudio/edit-hotkey-trigger': (args: { id: string } & Partial<TriggerHotkeyConfig>, msg: MessageMeta) => boolean
    'vtstudio/delete-hotkey-trigger': (args: { id: string }, msg: MessageMeta) => boolean
    'vtstudio/mock-hotkey-trigger': (args: { configID: string }, msg: MessageMeta) => boolean
    'vtstudio/complete-color-tint': (args: { id: string }, msg: MessageMeta) => boolean
    'vtstudio/add-color-tint': (args: Partial<ColorTintConfig>, msg: MessageMeta) => boolean
    'vtstudio/edit-color-tint': (args: { id: string } & Partial<ColorTintConfig>, msg: MessageMeta) => boolean
    'vtstudio/delete-color-tint': (args: { id: string }, msg: MessageMeta) => boolean
    'vtstudio/mock-color-tint': (args: { configID: string }, msg: MessageMeta) => boolean
    'vtstudio/edit-config': (args: Partial<VTubeStudioConfigData>, msg: MessageMeta) => boolean
    'vtstudio/set-status': (args: VTubeStudioStateData['status'], msg: MessageMeta) => boolean
    'subathon/set-active': (args: { active: boolean }, msg: MessageMeta) => boolean
    'subathon/start-timer': (args: {}, msg: MessageMeta) => boolean
    'subathon/stop-timer': (args: {}, msg: MessageMeta) => boolean
    'subathon/add-time': (args: { duration: number }, msg: MessageMeta) => boolean
    'subathon/remove-time': (args: { duration: number }, msg: MessageMeta) => boolean
    'subathon/set-time': (args: { duration: number }, msg: MessageMeta) => boolean
    'subathon/add-trigger': (args: Partial<SubathonTriggerConfig>, msg: MessageMeta) => boolean
    'subathon/edit-trigger': (args: { id: string } & Partial<SubathonTriggerConfig>, msg: MessageMeta) => boolean
    'subathon/delete-trigger': (args: { id: string }, msg: MessageMeta) => boolean
    'subathon/set-config': (args: Partial<SubathonConfigData>, msg: MessageMeta) => boolean
    'subathon/mock': (args: { triggerID: string }, msg: MessageMeta) => boolean
    'channelinfo/set-config': (args: Partial<ChannelInfoConfigData>, msg: MessageMeta) => boolean
    'channelinfo/get-icons': (args: { forceReload: boolean }, msg: MessageMeta) => Promise<IconMap>
    'tts/speak': (args: { voice: string, text: string, style: string, pitch: number }, msg: MessageMeta) => Promise<string>
    'twitch/rewards': (args: {}, msg: MessageMeta) => Promise<TwitchReward[]>
    'debug/reload': (args: {}, msg: MessageMeta) => boolean
    'debug/send-logs': (args: { logs: LogMessage[] }, msg: MessageMeta) => boolean
    'debug/set-config': (args: Partial<DebugConfigData>, msg: MessageMeta) => boolean
    'config/enable-module': (args: { type: ModuleType, enabled: boolean }, msg: MessageMeta) => boolean
    'access/set': (args: { userType: AccountType, targetType: AccountType, id: string, access: Access }, msg: MessageMeta) => boolean
}

export interface ChannelViews {
    'access-denied': (args: Partial<AccessDeniedViewData>, msg: MessageMeta) => Promise<AccessDeniedViewData>
    'channel': (args: Partial<ChannelViewData>, msg: MessageMeta) => Promise<ChannelViewData>
    'overlay': (args: Partial<OverlayViewData>, msg: MessageMeta) => Promise<OverlayViewData>
    'controlpanel-app': (args: Partial<ControlPanelAppViewData>, msg: MessageMeta) => Promise<ControlPanelAppViewData>
    'overlay-app': (args: Partial<OverlayAppViewData>, msg: MessageMeta) => Promise<OverlayAppViewData>
}

export interface ChannelServerMessages {
    'backdrop/fire-cannon': (args: { text: string }, msg: MessageMeta) => void
    'backdrop/swap-camera': (args: { name: string }, msg: MessageMeta) => void
}

export interface ChannelClientMessages {

}

export interface GlobalActions {
    'access/request': (args: { channel: string }, msg: MessageMeta) => boolean
    'access/set': (args: { userType: AccountType, targetType: AccountType, id: string, access: Access }, msg: MessageMeta) => boolean
    'debug/send-logs': (args: { logs: LogMessage[] }, msg: MessageMeta) => boolean
}

export interface GlobalViews {
    'authorize': (args: Omit<AuthorizeViewData, keyof GlobalBaseViewData>, msg: MessageMeta) => Promise<AuthorizeViewData>
    'landing': (args: Partial<LandingViewData>, msg: MessageMeta) => Promise<LandingViewData>
    'message': (args: Omit<MessageViewData, keyof GlobalBaseViewData>, msg: MessageMeta) => Promise<MessageViewData>
    'landing-app': (args: Partial<LandingAppViewData>, msg: MessageMeta) => Promise<LandingAppViewData>
}

export interface GlobalServerMessages {

}

export interface GlobalClientMessages {

}
