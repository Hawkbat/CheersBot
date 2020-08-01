import { Icon } from 'shared'
import * as React from 'react'
import { TwitchIcon } from '../controls/TwitchIcon'
import { classes } from '../utils'

export function Mode(props: { visible: boolean, icon: Icon, msg: string, username?: string }) {
    return <div className={classes("Mode", "toggleable", { visible: props.visible })}>
        <TwitchIcon icon={props.icon} size={2} />&nbsp;<b>{props.username}</b>&nbsp;{props.msg}
    </div>
}
