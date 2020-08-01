import * as React from 'react'

export function PanelHeader(props: { children: React.ReactNode }) {
    return <h1 className="PanelHeader">
        {props.children}
    </h1>
}
