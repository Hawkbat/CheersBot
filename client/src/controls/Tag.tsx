import * as React from 'react'

export function Tag(props: { onClick: React.MouseEventHandler, children: React.ReactNode }) {
    return <div className="Tag" onClick={props.onClick}>{props.children}</div>
}
