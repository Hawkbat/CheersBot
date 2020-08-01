import * as React from 'react'
import { classes } from '../utils'

export function PanelGroup(props: { label: string, open: boolean, onToggle: (open: boolean) => void, children: React.ReactNode }) {
    return <div className="PanelGroup">
        <span className="legend">{props.label}</span>
        <div className={classes("opener", { open: props.open })} onClick={e => props.onToggle(!props.open)}></div>
        {props.open ? props.children : <></>}
    </div>
}
