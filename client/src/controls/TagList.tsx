import * as React from 'react'
import { Tag } from './Tag'

export function TagList(props: { selected: string[], options: { text: string, value: string }[], onSelect: (value: string) => void, onDeselect: (value: string) => void }) {
    return <div className="TagList">
        <select className="dropdown" onChange={e => {
            props.onSelect(e.target.value)
            e.target.value = ''
        }}>
            <option></option>
            {props.options.filter(o => !props.selected.includes(o.value)).map(o => <option key={o.value} value={o.value}>{o.text}</option>)}
        </select>
        <div className="list">
            {props.options.filter(o => props.selected.includes(o.value)).map(o => <Tag key={o.value} onClick={e => props.onDeselect(o.value)}>{o.text}</Tag>)}
        </div>
    </div>
}
