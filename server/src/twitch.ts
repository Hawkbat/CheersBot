import { Icon } from 'shared'
import { ApiClient as TwitchClient, TwitchApiCallType } from 'twitch'

export interface TwitchTokenResponse {
    access_token: string
    refresh_token: string
    expires_in: number
    scope: string[]
    token_type: 'bearer'
}

interface TwitchChannelEmoteResponse {
    data: {
        id: string
        name: string
        images: {
            url_1x: string
            url_2x: string
            url_4x: string
        }
        tier: string
        emote_type: 'subscriptions' | 'bitstier' | 'follower'
        emote_set_id: string
    }[]
}

interface TwitchGlobalEmoteResponse {
    data: {
        id: string
        name: string
        images: {
            url_1x: string
            url_2x: string
            url_4x: string
        }
    }[]
}

interface TwitchBadgeResponse {
    data: {
        set_id: string
        versions: {
            id: string
            image_url_1x: string
            image_url_2x: string
            image_url_4x: string
        }[]
    }[]
}

const BADGES_BASE_URL = 'https://static-cdn.jtvnw.net/badges/v1/'

export async function getTwitchChannelEmotes(client: TwitchClient, id: string): Promise<Icon[]> {
    const result = await client.callApi<TwitchChannelEmoteResponse>({
        url: 'chat/emotes',
        type: TwitchApiCallType.Helix,
        query: { broadcaster_id: id },
    })
    return result.data.map(e => ({ type: 'emote', id: e.id, name: e.name }))
}

export async function getTwitchGlobalEmotes(client: TwitchClient): Promise<Icon[]> {
    const result = await client.callApi<TwitchGlobalEmoteResponse>({
        url: 'chat/emotes/global',
        type: TwitchApiCallType.Helix,
    })
    return result.data.map(e => ({ type: 'emote', id: e.id, name: e.name }))
}

export async function getTwitchChannelBadges(client: TwitchClient, id: string): Promise<Icon[]> {
    const result = await client.callApi<TwitchBadgeResponse>({
        url: 'chat/badges',
        type: TwitchApiCallType.Helix,
        query: { broadcaster_id: id },
    })
    return result.data.flatMap(set => set.versions.map(b => ({ type: 'badge', id: b.image_url_1x.substr(BADGES_BASE_URL.length, 36), name: `${set.set_id} ${b.id}` })))
}

export async function getTwitchGlobalBadges(client: TwitchClient): Promise<Icon[]> {
    const result = await client.callApi<TwitchBadgeResponse>({
        url: 'chat/badges/global',
        type: TwitchApiCallType.Helix,
    })
    return result.data.flatMap(set => set.versions.map(b => ({ type: 'badge', id: b.image_url_1x.substr(BADGES_BASE_URL.length, 36), name: `${set.set_id} ${b.id}` })))
}
