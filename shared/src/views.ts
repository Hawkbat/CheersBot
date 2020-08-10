import { RedeemType, Icon, RedeemModeDisplay, PanelType, ChannelData } from './data'

export interface PanelViewData {
    type: PanelType
    open: boolean
}

export interface ControlPanelViewData {
    username: string
    channel: string
    data: ChannelData
    channels: string[]
    redeemTypes: { [key: string]: RedeemType }
    icons: Icon[]
    panels: PanelViewData[]
    updateTime: Date
    refreshTime: number
}

export interface OverlayViewData {
    channel: string
    data: ChannelData
    modes: RedeemModeDisplay[]
    refreshTime: number
}
