import { Icon } from 'shared'
import * as React from 'react'
import { ExternalIcon } from './ExternalIcon'

export function Bubble(props: { icon: Icon, msg: string, username?: string }) {
    return <div className="Mode">
        <ExternalIcon icon={props.icon} size={2} />{props.username && <>&nbsp;<b>{props.username}</b>&nbsp;</>}<span dangerouslySetInnerHTML={{ __html: props.msg }} />
    </div>
}
