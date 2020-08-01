import { Icon } from 'shared'
import { getJSON } from './utils'

const BASE_URL = 'https://api.twitchemotes.com/api/v4'

const BADGES_BASE_URL = 'https://static-cdn.jtvnw.net/badges/v1/'

interface ErrorResponse {
    error: string
}

interface EmotesResponse {
    code: string
    emoticon_set: number
    id: number
    channel_id: string | null
    channel_name: string | null
}

const emoteCache = new Map<string, EmotesResponse[] | ErrorResponse>()

async function rawGetEmotes(ids: string[]): Promise<EmotesResponse[] | ErrorResponse> {
    const key = ids.join(',')
    const cached = emoteCache.get(key)
    if (cached) return cached
    const result = await getJSON<EmotesResponse[] | ErrorResponse>(`${BASE_URL}/emotes?id=${key}`)
    if (!result) return { error: 'Unable to parse emotes API call result' }
    emoteCache.set(key, result)
    return result
}

interface SetsResponse {
    set_id: string
    channel_id: string
    channel_name: string
    tier: number
}

const setCache = new Map<string, SetsResponse[] | ErrorResponse>()

async function rawGetSets(ids: string[]): Promise<SetsResponse[] | ErrorResponse> {
    const key = ids.join(',')
    const cached = setCache.get(key)
    if (cached) return cached
    const result = await getJSON<SetsResponse[] | ErrorResponse>(`${BASE_URL}/sets?id=${key}`)
    if (!result) return { error: 'Unable to parse emote sets API call result' }
    setCache.set(key, result)
    return result
}

interface ChannelsResponse {
    channel_name: string
    channel_id: string
    broadcaster_type: string
    plans: { [key: string]: string | null }
    emotes: {
        code: string
        emoticon_set: number
        id: number
    }[] | null
    subscriber_badges: {
        [key: number]: {
            image_url_1x: string
            image_url_2x: string
            image_url_4x: string
            title: string
        }
    } | null
    bits_badges: {
        [key: number]: {
            image_url_1x: string
            image_url_2x: string
            image_url_4x: string
            title: string
        }
    } | null
    cheermotes: {
        [key: number]: {
            1: string
            1.5: string
            2: string
            3: string
            4: string
        }
    } | null
    base_set_id: string
    display_name: string
    generated_at: Date
}

const channelsCache = new Map<string, ChannelsResponse | ErrorResponse>()

async function rawGetChannels(channelID: string): Promise<ChannelsResponse | ErrorResponse> {
    const key = channelID
    const cached = channelsCache.get(key)
    if (cached) return cached
    const result = await getJSON<ChannelsResponse | ErrorResponse>(`${BASE_URL}/channels/${key}`)
    if (!result) return { error: 'Unable to parse channels API call result' }
    channelsCache.set(key, result)
    return result
}

export async function getTwitchEmotes(channelID: string): Promise<Icon[]> {
    const channels = await rawGetChannels(channelID)
    if ('error' in channels) return []
    const emotes: Icon[] = []
    if (channels.emotes) {
        emotes.push(...channels.emotes.filter(e => !e.code.includes('\\')).map(e => {
            const emote: Icon = { type: 'emote', id: '' + e.id, name: e.code }
            return emote
        }))
    }
    emotes.sort((a, b) => a.name.localeCompare(b.name))
    return emotes
}

export async function getTwitchBadges(channelID: string): Promise<Icon[]> {
    const channels = await rawGetChannels(channelID)
    if ('error' in channels) return []
    const badges: Icon[] = []
    if (channels.subscriber_badges) {
        badges.push(...Object.values(channels.subscriber_badges).map(b => {
            const badge: Icon = { type: 'badge', id: b.image_url_1x.substr(BADGES_BASE_URL.length, 36), name: b.title }
            return badge
        }))
    }
    if (channels.bits_badges) {
        badges.push(...Object.values(channels.bits_badges).map(b => {
            const badge: Icon = { type: 'badge', id: b.image_url_1x.substr(BADGES_BASE_URL.length, 36), name: b.title }
            return badge
        }))
    }
    return badges
}
