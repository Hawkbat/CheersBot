import * as React from 'react'
import { classes } from '../utils'

export function Tab(props: { active: boolean, onClick: React.MouseEventHandler, children: React.ReactNode }) {
    return <div className={classes("Tab", { active: props.active })} onClick={props.onClick}>{props.children}</div>
}
