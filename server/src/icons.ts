import { ApiClient as TwitchClient } from 'twitch'
import { Icon, IconMap, resolveObject } from 'shared'
import { getBTTVEmotes, getGlobalBTTVEmotes } from './betterttv'
import { getFFZEmotes } from './frankerfacez'
import { getTwitchChannelBadges, getTwitchChannelEmotes, getTwitchGlobalBadges, getTwitchGlobalEmotes } from './twitch'

export async function getFontAwesomeBrandingIcons(): Promise<Icon[]> {
    return [
        { id: 'discord', type: 'fa-brand', name: 'Discord' },
        { id: 'deviantart', type: 'fa-brand', name: 'DeviantArt' },
        { id: 'etsy', type: 'fa-brand', name: 'Etsy' },
        { id: 'facebook', type: 'fa-brand', name: 'Facebook' },
        { id: 'github', type: 'fa-brand', name: 'Github' },
        { id: 'google', type: 'fa-brand', name: 'Google' },
        { id: 'instagram', type: 'fa-brand', name: 'Instagram' },
        { id: 'itunes', type: 'fa-brand', name: 'iTunes' },
        { id: 'linkedin', type: 'fa-brand', name: 'LinkedIn' },
        { id: 'medium', type: 'fa-brand', name: 'Medium' },
        { id: 'mixer', type: 'fa-brand', name: 'Mixer' },
        { id: 'patreon', type: 'fa-brand', name: 'Patreon' },
        { id: 'paypal', type: 'fa-brand', name: 'Paypal' },
        { id: 'pinterest', type: 'fa-brand', name: 'Pinterest' },
        { id: 'reddit', type: 'fa-brand', name: 'Reddit' },
        { id: 'snapchat', type: 'fa-brand', name: 'Snapchat' },
        { id: 'soundcloud', type: 'fa-brand', name: 'SoundCloud' },
        { id: 'spotify', type: 'fa-brand', name: 'Spotify' },
        { id: 'steam', type: 'fa-brand', name: 'Steam' },
        { id: 'tiktok', type: 'fa-brand', name: 'TikTok' },
        { id: 'tumblr', type: 'fa-brand', name: 'Tumblr' },
        { id: 'twitter', type: 'fa-brand', name: 'Twitter' },
        { id: 'vimeo', type: 'fa-brand', name: 'Vimeo' },
        { id: 'youtube', type: 'fa-brand', name: 'YouTube' },
    ]
}

const GLOBAL_CACHE_EXPIRY = 1000 * 60 * 60 * 8
const CHANNEL_CACHE_EXPIRY = 1000 * 60 * 60 * 2

let globalCache: { timestamp: number, icons: IconMap } | null = null

const channelCache: Map<string, { timestamp: number, icons: IconMap }> = new Map()

export async function getChannelIcons(client: TwitchClient, twitchChannelId: string, forceReload: boolean): Promise<IconMap> {
    const cached = channelCache.get(twitchChannelId)
    if (cached && Date.now() < cached.timestamp + CHANNEL_CACHE_EXPIRY && !forceReload) {
        return cached.icons
    }

    await getTwitchChannelEmotes(client, twitchChannelId)

    const icons = await resolveObject({
        'Channel Emotes': getTwitchChannelEmotes(client, twitchChannelId),
        'Channel Badges': getTwitchChannelBadges(client, twitchChannelId),
        'FFZ Channel Emotes': getFFZEmotes(twitchChannelId),
        'BTTV Channel Emotes': getBTTVEmotes(twitchChannelId),
    })
    channelCache.set(twitchChannelId, { timestamp: Date.now(), icons })
    return icons
}

export async function getGlobalIcons(client: TwitchClient, forceReload: boolean): Promise<IconMap> {
    const cached = globalCache
    if (cached && Date.now() < cached.timestamp + GLOBAL_CACHE_EXPIRY && !forceReload) {
        return cached.icons
    }

    const icons = await resolveObject({
        'Global BTTV Emotes': getGlobalBTTVEmotes(),
        'Global Twitch Emotes': getTwitchGlobalEmotes(client),
        'Global Twitch Badges': getTwitchGlobalBadges(client),
        'Social Media Icons': getFontAwesomeBrandingIcons(),
    })
    globalCache = { timestamp: Date.now(), icons }
    return icons
}

export async function getAllIcons(client: TwitchClient, twitchChannelId: string, forceReload: boolean): Promise<IconMap> {
    return {
        ...await getChannelIcons(client, twitchChannelId, forceReload),
        ...await getGlobalIcons(client, forceReload),
    }
}
