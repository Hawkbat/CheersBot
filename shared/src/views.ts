import { RedeemMode, UserEvent, UserEventConfig, RedeemType, Icon, RedeemModeDisplay, PanelType } from './data'

export interface PanelViewData {
    type: PanelType
    open: boolean
}

export interface ControlPanelViewData {
    username: string
    headpats: number
    evilCount: number
    evilTime: number
    modes: RedeemMode[]
    events: UserEvent[]
    eventConfigs: UserEventConfig[]
    channel: string
    channels: string[]
    redeemTypes: { [key: string]: RedeemType }
    icons: Icon[]
    panels: PanelViewData[]
    updateTime: Date
    refreshID: number
}

export interface OverlayViewData {
    channel: string
    headpats: number
    evilCount: number
    evilTime: number
    modes: RedeemModeDisplay[]
    notifications: Notification[]
    refreshID: number
}
