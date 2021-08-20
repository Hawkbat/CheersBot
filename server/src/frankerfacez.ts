import { Icon, logError } from 'shared'
import { getJSON } from './utils'

interface RoomResponse {
    room: {
        _id: number
        css: null
        display_name: string
        id: string
        is_group: boolean
        mod_urls: null
        moderator_badge: null
        set: number
        twitch_id: number
        user_badges: {}
    }
    sets: {
        [key: string]: {
            _type: number
            css: null
            description: null
            emoticons: {
                height: number
                hidden: boolean
                id: number
                margins: null
                modifier: boolean
                name: string
                offset: null
                owner: {
                    _id: number
                    display_name: string
                    name: string
                }
                public: boolean
                urls: {
                    1: string
                    2: string
                    4: string
                }
                width: number
            }[]
            icon: null
            id: number
            title: string
        }
    }
}

interface EmoteResponse {
    emote: {
        created_at: string
        css: null
        height: number
        hidden: boolean
        id: number
        last_updated: string
        margins: null
        modifier: boolean
        name: string
        offset: null
        owner: {
            _id: number
            display_name: string
            name: string
        }
        public: boolean
        status: number
        urls: {
            1: string
            2: string
            4: string
        }
        usage_count: number
        width: number
    }
}

const emoteCache: { [key: string]: string } = {}

function getCacheKey(id: string, size: number) {
    return id + "/" + size
}

export async function getFFZEmotes(channelID: string): Promise<Icon[]> {
    const result = await getJSON<RoomResponse>(`https://api.frankerfacez.com/v1/room/id/${channelID}`)
    if (!result) {
        logError(channelID, 'ffz', `Failed to retrieve FFZ emotes for channel ${channelID}`)
        return []
    }
    return Object.values(result.sets ?? {}).map(s => s.emoticons).flat().map(e => ({ type: 'ffz', id: '' + e.id, name: e.name }))
}

export async function getFFZEmoteURL(id: string, size: 1 | 2 | 3): Promise<string> {
    const key = getCacheKey(id, size)
    if (emoteCache[key]) return emoteCache[key]
    const result = await getJSON<EmoteResponse>(`https://api.frankerfacez.com/v1/emote/${id}`)
    if (!result) {
        logError('global', 'bttv', `Failed to retrieve FFZ emote ${id}`)
        return 'about:blank'
    }
    const url = result.emote.urls[size === 3 ? 4 : size]
    emoteCache[key] = url
    return url
}
