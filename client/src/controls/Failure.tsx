import * as React from 'react'
import { classes } from '../utils'
import { Icon } from './Icon'

export function Failure(props: { tooltip?: string }) {
    return <div className={classes('Failure')} title={props.tooltip}><Icon icon="times-octagon" style="solid" /></div>
}
