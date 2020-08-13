import * as React from 'react'
import { classes } from '../utils'

export function Toggle(props: { value: boolean, onToggle: (value: boolean) => void }) {
    return <div className={classes("Toggle", { active: props.value })} onClick={e => props.onToggle(!props.value)}>{props.value ? 'On' : 'Off'}</div>
}
