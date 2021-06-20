import * as React from 'react'

export function Expander(props: { open: boolean, onToggle: (open: boolean) => void }) {
    return <div className="Expander" onClick={() => props.onToggle(!props.open)}>{props.open ? 'Hide Details' : 'Show Details'}</div>
}
