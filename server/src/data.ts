import TwitchClient from 'twitch'
import ChatClient from 'twitch-chat-client'
import PubSubClient from 'twitch-pubsub-client'
import WebHookClient from 'twitch-webhooks'
import { RedeemMode, Store } from 'shared'

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

export interface Account<T extends AccountData> {
    id: string
    name: string
    data: Store<T>
    client: TwitchClient
}

export interface BotData extends AccountData {
    channels: string[]
}

export interface Bot extends Account<BotData> {
    chatClient: ChatClient
}

export interface ChannelData extends AccountData {
    bots: string[]
    users: string[]
    headpats: number
    headpatStreak: number
    evilCount: number
    evilTime: number
    modes: RedeemMode[]
}

export interface Channel extends Account<ChannelData> {
    pubSubClient: PubSubClient
    webHookClient: WebHookClient
}

export interface UserData extends AccountData {
    channels: string[]
}

export interface User extends Account<UserData> {

}
