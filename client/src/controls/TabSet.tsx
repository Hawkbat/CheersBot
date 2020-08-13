import * as React from 'react'
import { Tab } from './Tab'
import { Icon } from './Icon'

export function TabSet(props: { selected: string, options: { text?: string, value: string, icon?: string }[], onSelect: (value: string) => void }) {
    return <div className="TabSet">
        {props.options.map(o => <Tab key={o.value} active={o.value === props.selected} onClick={e => props.onSelect(o.value)}>{o.icon ? <><Icon icon={o.icon} />&nbsp;</> : <></>}{o.text ?? o.value}</Tab>)}
    </div>
}
