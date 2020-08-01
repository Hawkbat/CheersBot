import { Icon } from 'shared'
import * as React from 'react'

export function TwitchIcon(props: { icon: Icon, size: 1 | 2 | 3 }) {
    let src
    switch (props.icon.type) {
        case 'emote':
            src = `https://static-cdn.jtvnw.net/emoticons/v1/${props.icon.id}/${props.size}.0`
            break
        case 'badge':
            src = `https://static-cdn.jtvnw.net/badges/v1/${props.icon.id}/${props.size}`
            break
    }
    return <div className="TwitchIcon" data-size={props.size}>
        <img title={props.icon.name} src={src}></img>
    </div>
}
