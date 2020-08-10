import TwitchClient from 'twitch'
import ChatClient from 'twitch-chat-client'
import PubSubClient from 'twitch-pubsub-client'
import WebHookClient from 'twitch-webhooks'
import { Store, AccountData, BotData, ChannelData, UserData } from 'shared'
import { Router } from 'express'

export interface Secrets {
    twitch: {
        clientID: string
        clientSecret: string
    }
    session: {
        secret: string
    }
}

export interface Account<T extends AccountData> {
    id: string
    name: string
    data: Store<T>
    client: TwitchClient
}

export interface Bot extends Account<BotData> {
    chatClient: ChatClient
}

export interface Channel extends Account<ChannelData> {
    pubSubClient: PubSubClient
    webHookClient: WebHookClient
    router: Router
}

export interface User extends Account<UserData> {

}
