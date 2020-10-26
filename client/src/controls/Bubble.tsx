import { Icon } from 'shared'
import * as React from 'react'
import { TwitchIcon } from './TwitchIcon'
import { classes } from '../utils'

export function Bubble(props: { visible: boolean, icon: Icon, msg: string, username?: string }) {
    return <div className={classes("Mode", { visible: props.visible })}>
        <TwitchIcon icon={props.icon} size={2} />&nbsp;<b>{props.username}</b>&nbsp;<span dangerouslySetInnerHTML={{ __html: props.msg }} />
    </div>
}
