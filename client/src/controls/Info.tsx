import * as React from 'react'
import { classes } from '../utils'
import { Icon } from './Icon'

export function Info(props: { tooltip: string }) {
    return <div className={classes('Info')} title={props.tooltip}><Icon icon="info-circle" style="solid" /></div>
}
