import * as React from 'react'

export function Dropdown(props: { nullable?: boolean, selected: string, options: { text?: string, value: string }[], onSelect: (value: string, text: string) => void }) {
    return <select className="Dropdown" value={props.selected} onChange={e => props.onSelect(e.target.value, props.options.find(o => o.value === e.target.value)?.text ?? e.target.value)}>
        {props.nullable ? <option /> : <></>}
        {props.options.map(o => <option key={o.value} value={o.value}>{o.text ?? o.value}</option>)}
    </select>
}
