import { Icon, IconMap } from 'shared'
import * as React from 'react'
import { classes } from '../utils'
import { Dropdown } from './Dropdown'
import { ExternalIcon } from './ExternalIcon'

export function ExternalIconPicker(props: { selected: Icon | null, options: IconMap, onSelect: (icon: Icon | null) => void }) {
    const icons = Object.values(props.options).flat()
    const options = icons.map(o => ({ value: o.id, text: o.name }))
    return <div className={classes('ExternalIconPicker')}>
        <Dropdown nullable selected={props.selected?.id ?? ''} options={options} onSelect={v => props.onSelect(icons.find(o => o.id === v) ?? null)} />
        {props.selected ? <ExternalIcon icon={props.selected} size={1} /> : <></>}
    </div>
}
