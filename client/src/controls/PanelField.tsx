import * as React from 'react'
import { Info } from './Info'

export function PanelField(props: { label?: string, help?: string, children: React.ReactNode }) {
    return <div className="PanelField">
        {props.label ? <div className="label">{props.label}{props.help ? <Info tooltip={props.help} /> : <></>}</div> : <></>}
        <div className="body">{props.children}</div>
    </div>
}
