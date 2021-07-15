import * as React from 'react'
import { classes } from '../utils'
import { Icon } from './Icon'

export function Success(props: { tooltip?: string }) {
    return <div className={classes('Success')} title={props.tooltip}><Icon icon="check-circle" style="solid" /></div>
}
