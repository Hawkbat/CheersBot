import { Icon } from 'shared'
import * as React from 'react'
import { Icon as IconComponent } from './Icon'

export function ExternalIcon(props: { icon: Icon, size: 1 | 2 | 3 }) {
    let src
    let type
    switch (props.icon.type) {
        case 'emote':
            if (props.icon.id.startsWith('emotesv2_'))
                src = `https://static-cdn.jtvnw.net/emoticons/v2/${props.icon.id}/default/dark/${props.size}.0`
            else
                src = `https://static-cdn.jtvnw.net/emoticons/v1/${props.icon.id}/${props.size}.0`
            type = 'Twitch Emote'
            break
        case 'badge':
            src = `https://static-cdn.jtvnw.net/badges/v1/${props.icon.id}/${props.size}`
            type = 'Twitch Badge'
            break
        case 'ffz':
            src = `/ffz/${props.icon.id}/${props.size}`
            type = 'FFZ Emote'
            break
        case 'bttv':
            src = `https://cdn.betterttv.net/emote/${props.icon.id}/${props.size}x`
            type = 'BTTV Emote'
            break
        case 'discord':
            src = `https://cdn.discordapp.com/emojis/${props.icon.id}.png`
            type = 'Discord'
            break
        case 'logo':
            src = `/logos/${props.icon.id}-${props.size}.png`
            type = 'Logo'
            break
        case 'fa-brand':
            return <div className="ExternalIcon" data-size={props.size} title={`${props.icon.name} (Brand Logo)`}>
                <IconComponent data-size={props.size} fixedWidth icon={props.icon.id} style="brand" />
            </div>
        case 'url':
            src = props.icon.id
            type = 'External Image'
            break
    }
    return <div className="ExternalIcon" data-size={props.size}>
        <img title={`${props.icon.name} (${type})`} src={src}></img>
    </div>
}
