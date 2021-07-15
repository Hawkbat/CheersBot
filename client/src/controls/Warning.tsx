import * as React from 'react'
import { classes } from '../utils'
import { Icon } from './Icon'

export function Warning(props: { tooltip?: string }) {
    return <div className={classes('Warning')} title={props.tooltip}><Icon icon="exclamation-triangle" style="solid" /></div>
}
