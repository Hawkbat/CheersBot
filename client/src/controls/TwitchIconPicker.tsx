import { Icon } from 'shared'
import * as React from 'react'
import { classes } from '../utils'
import { Dropdown } from './Dropdown'
import { TwitchIcon } from './TwitchIcon'

export function TwitchIconPicker(props: { selected: Icon | null, options: Icon[], onSelect: (icon: Icon | null) => void }) {
    return <div className={classes('TwitchIconPicker')}>
        <Dropdown nullable selected={props.selected?.id ?? ''} options={props.options.map(o => ({ value: o.id, text: o.name }))} onSelect={v => props.onSelect(props.options.find(o => o.id === v) ?? null)} />
        {props.selected ? <TwitchIcon icon={props.selected} size={1} /> : <></>}
    </div>
}
