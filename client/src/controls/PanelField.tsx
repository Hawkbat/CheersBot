import * as React from 'react'

export function PanelField(props: { label?: string, children: React.ReactNode }) {
    return <div className="PanelField">
        {props.label ? <div className="label">{props.label}</div> : <></>}
        <div className="body">{props.children}</div>
    </div>
}
