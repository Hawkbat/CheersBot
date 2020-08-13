import * as React from 'react'
import { classes } from '../utils'

export function PanelGroup(props: { label: string, open?: boolean, onToggle?: (open: boolean) => void, children: React.ReactNode }) {
    return <div className="PanelGroup">
        <span className="legend">{props.label}</span>
        {props.onToggle ? <div className={classes("opener", { open: props.open ?? true })} onClick={e => props.onToggle?.(!props.open)}></div> : <></>}
        {props.open ?? true ? props.children : <></>}
    </div>
}
