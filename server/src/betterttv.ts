import { Icon } from 'shared'
import { getJSON } from './utils'

type GlobalResponse = {
    id: string
    code: string
    imageType: string
    userId: string
}[]

interface ChannelResponse {
    id: string
    bots: []
    channelEmotes: {
        id: string
        code: string
        imageType: string
        userId: string
    }[]
    sharedEmotes: {
        id: string
        code: string
        imageType: string
        user: {
            id: string
            name: string
            displayName: string
            providerId: string
        }
    }[]
}

interface ErrorResponse {
    message: string
}

export async function getBTTVEmotes(channelID: string): Promise<Icon[]> {
    const result = await getJSON<ChannelResponse | ErrorResponse>(`https://api.betterttv.net/3/cached/users/twitch/${channelID}`)
    if (!result) {
        console.error(`Failed to fetch BTTV emotes for channel ${channelID}`)
        return []
    }
    if ('message' in result) return []
    return [...result.channelEmotes, ...result.sharedEmotes].map(e => ({ type: 'bttv', id: e.id, name: e.code }))
}

export async function getGlobalBTTVEmotes(): Promise<Icon[]> {
    const result = await getJSON<GlobalResponse>(`https://api.betterttv.net/3/cached/emotes/global`)
    if (!result) {
        console.error('Failed to fetch global BTTV emotes')
        return []
    }
    return result.map(e => ({ type: 'bttv', id: e.id, name: e.code }))
}
