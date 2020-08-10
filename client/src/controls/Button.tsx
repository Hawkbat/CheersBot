import * as React from 'react'
import { classes } from '../utils'

export function Button(props: { primary?: boolean, href?: string, onClick?: React.MouseEventHandler<HTMLAnchorElement>, children: React.ReactNode }) {
    return <a className={classes("button", { primary: props.primary ?? false })} href={props.href} onClick={e => props.onClick ? props.onClick(e) : void 0}>{props.children}</a>
}
