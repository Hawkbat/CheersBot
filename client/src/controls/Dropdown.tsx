import * as React from 'react'

export interface DropdownOption {
    value: string
    text?: string
    invalid?: boolean
}

export function Dropdown<T extends string>(props: { nullable?: boolean, nullText?: string, selected: T, options: DropdownOption[], onSelect: (value: T) => void }) {
    return <select className="Dropdown" value={props.selected} onChange={e => props.onSelect(e.target.value as T)}>
        {props.nullable ? <option value="">{props.nullText}</option> : <></>}
        {props.options.map(o => <option key={o.value} value={o.value}>{o.text ?? o.value}{o.invalid ? '*' : ''}</option>)}
    </select>
}
