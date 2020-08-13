import * as React from 'react'

export function Dropdown(props: { selected: string, options: { text?: string, value: string }[], onSelect: (value: string) => void }) {
    return <select className="Dropdown" value={props.selected} onChange={e => props.onSelect(e.target.value)}>
        {props.options.map(o => <option key={o.value} value={o.value}>{o.text ?? o.value}</option>)}
    </select>
}
