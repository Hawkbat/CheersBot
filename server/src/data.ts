import { ApiClient } from 'twitch'
import { ChatClient } from 'twitch-chat-client'
import { PubSubClient } from 'twitch-pubsub-client'
import { WebHookListener } from 'twitch-webhooks'
import { Store, AccessMap, ModuleMap } from 'shared'
import { Router } from 'express'

export interface Secrets {
    twitch: {
        clientID: string
        clientSecret: string
    }
    discord: {
        clientID: string
        clientSecret: string
        botToken: string
    }
    session: {
        secret: string
    }
    local: boolean
    superUsers: string[]
}

export interface Account<T extends AccountData> {
    id: string
    name: string
    data: Store<T>
    client: ApiClient
}

export interface Bot extends Account<BotData> {
    chatClient: ChatClient
}

export interface Channel extends Account<ChannelData> {
    pubSubClient: PubSubClient
    webHookClient: WebHookListener
    router: Router
}

export interface User extends Account<UserData> {

}

export interface TwitchToken {
    accessToken: string
    refreshToken: string
    scope: string[]
}

export interface DiscordToken {
    accessToken: string
    refreshToken: string
    expiration: number
    scope: string[]
}

export interface AccountData {
    token: TwitchToken
    discord?: DiscordToken
}

export interface BotData extends AccountData {
    channels: AccessMap
}

export interface ChannelData extends AccountData {
    bots: AccessMap
    users: AccessMap
    modules: ModuleMap
}

export interface UserData extends AccountData {
    channels: AccessMap
}
