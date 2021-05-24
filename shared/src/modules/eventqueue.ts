import { ModuleVersion } from '../data'
import { ModuleStateData, ModuleConfigData, Module, ModuleMap } from './common'

export enum TwitchSubTypes {
    tier1 = 'Tier 1',
    tier2 = 'Tier 2',
    tier3 = 'Tier 3',
    prime = 'Prime',
    gifted = 'Gifted',
}

export enum UserEventType {
    follow = 'Follows',
    sub = 'Subs',
    bit = 'Bits',
    raid = 'Raids',
    host = 'Hosts',
    channelPoint = 'Channel Points',
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
    countAcknowledged = 'Total count acknowledged',
    countNotAcknowledged = 'Total count not acknowledged',
    amount = 'Total amount',
    amountMax = 'Highest amount',
}

interface BaseUserEventConfig {
    id: string
    name: string
    enabled: boolean
    type: UserEventType
    subTypes: string[]
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

interface FollowUserEventConfig extends BaseUserEventConfig {
    type: UserEventType.follow
    subTypes: []
}

interface SubUserEventConfig extends BaseUserEventConfig {
    type: UserEventType.sub
    subTypes: TwitchSubTypes[]
}

interface BitUserEventConfig extends BaseUserEventConfig {
    type: UserEventType.bit
    subTypes: []
}

interface RaidUserEventConfig extends BaseUserEventConfig {
    type: UserEventType.raid
    subTypes: []
}

interface HostUserEventConfig extends BaseUserEventConfig {
    type: UserEventType.host
    subTypes: []
}

interface ChannelPointEventConfig extends BaseUserEventConfig {
    type: UserEventType.channelPoint
    subTypes: string[]
}

export type UserEventConfig =
    | FollowUserEventConfig
    | SubUserEventConfig
    | BitUserEventConfig
    | RaidUserEventConfig
    | HostUserEventConfig
    | ChannelPointEventConfig

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
    acknowledgeTime?: number
}

export interface Notification {
    id: string
    configId: string
    eventId: string
}

export interface Timer {
    id: string
    configId: string
    eventId: string
    startTime: number
    duration: number
    endTime?: number
}

export interface EventQueueStateData extends ModuleStateData {
    
}

export interface EventQueueConfigData extends ModuleConfigData {
    
}

export const EventQueueModule: Module<EventQueueStateData, EventQueueConfigData> = {
    name: 'Event Queue',
    description: 'Generic notification/alert system for various Twitch events, including channel point redemptions.',
    version: ModuleVersion.preAlpha,
    getData: (modules: ModuleMap) => modules.eventQueue,
}
