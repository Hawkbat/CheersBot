
export type RedeemType =
    | 'girldm headpats'
    | 'girldm heccin ban me'
    | 'nyan nyan dm~'
    | 'GIRLDM JAPANESE MODE ACTIVATE'
    | 'girldm say something!!'

export interface RedeemMode {
    id: string
    type: RedeemType
    userID: string
    userName: string
    message: string
    amount: number
    redeemTime: number
    visible: boolean
    startTime?: number
    duration?: number
}

export interface RedeemModeDisplay extends RedeemMode {
    icon: Icon
    showName: boolean
    msg: string
}

export enum PanelType {
    headpats = 'Headpats',
    evilDM = 'Evil DM',
    eventQueue = 'Event Queue',
    userAndChannel = 'User and Channel',
    debug = 'Debug',
}

export interface Icon {
    type: 'emote' | 'badge'
    id: string
    name: string
}

export enum UserEventType {
    follow = 'Follows',
    sub = 'Subs',
    bit = 'Bits',
    raid = 'Raids',
    host = 'Hosts',
    channelPoint = 'Channel Points',
}

export enum UserEventSubtype {
    tier1 = 'Tier 1',
    tier2 = 'Tier 2',
    tier3 = 'Tier 3',
    prime = 'Prime',
    gifted = 'Gifted',
}

export enum UserEventCondition {
    manually = 'manual',
    immediately = 'immediately',
    timerStarts = 'timer starts',
    timerStops = 'timer stops',
    eventAcknowledged = 'acknowledged',
    userTimedOut = 'user timed out',
    userUnTimedOut = 'user untimed out',
    newEventAnyType = 'new event (any type)',
    newEventSameType = 'new event (same type)',
    outOfStock = 'out of stock',
}

export enum UserEventCombine {
    add = 'Add new',
    replace = 'Replace existing',
    count = 'Total count',
    countAcknowledged = 'Total count (acknowledged)',
    countNotAcknowledged = 'Total count (not acknowledged)',
    amount = 'Total amount',
    amountMax = 'Highest amount',
}

export interface UserEventConfig {
    id: string
    name: string
    enabled: boolean
    type: UserEventType
    subTypes: (string | UserEventSubtype)[]
    combine: UserEventCombine
    minAmount: number
    notification: {
        enabled: boolean
        icon: string
        message: string
        showWhen: UserEventCondition[]
        clearWhen: UserEventCondition[]
        clearDelay: number
    }
    timer: {
        enabled: boolean
        duration: number | null
        message: string
        startWhen: UserEventCondition[]
        stopWhen: UserEventCondition[]
    }
    acknowledgment: {
        enabled: boolean
        message: string
        acknowledgeWhen: UserEventCondition[]
    }
    chats: {
        enabled: boolean
        message: string
        sendWhen: UserEventCondition[]
    }[]
}

export interface UserEvent {
    id: string
    type: string
    subType: string
    user: {
        id: string
        name: string
    }
    target: {
        id: string
        name: string
    }
    message: string
    amount: number
    time: number
    timer: {
        startTime?: number
        duration?: number
        endTime?: number
    }
    acknowledgeTime?: number
}

export interface Notification {
    id: string
    config: UserEventConfig
    event: UserEvent
}
