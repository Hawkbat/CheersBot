import * as React from 'react'
import { classes } from '../utils'
import { Icon } from './Icon'

export function Info(props: { tooltip: string, text?: string }) {
    return <div className={classes('Info')} title={props.tooltip}>{props.text}<Icon icon="info-circle" style="solid" /></div>
}
