import * as React from 'react'
import { classes } from '../utils'

export function Icon(props: { icon: string, style?: 'solid' | 'regular' | 'light' | 'duotone' | 'brand', fixedWidth?: boolean }) {
    return <i className={classes(`fa-${props.icon}`, {
        fas: !props.style || props.style === 'solid',
        far: props.style === 'regular',
        fal: props.style === 'light',
        fad: props.style === 'duotone',
        fab: props.style === 'brand',
        'fa-fw': props.fixedWidth === true,
    })}></i>
}
