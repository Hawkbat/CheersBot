import { Icon } from 'shared'
import * as React from 'react'
import { ExternalIcon } from './ExternalIcon'
import { classes } from '../utils'

export function Bubble(props: { visible: boolean, icon: Icon, msg: string, username?: string }) {
    return <div className={classes("Mode", { visible: props.visible })}>
        <ExternalIcon icon={props.icon} size={2} />{props.username && <>&nbsp;<b>{props.username}</b>&nbsp;</>}<span dangerouslySetInnerHTML={{ __html: props.msg }} />
    </div>
}
