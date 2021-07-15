import * as React from 'react'
import { useContext } from 'react'
import { classes } from '../utils'
import { Icon } from './Icon'
import { infoPopupContext } from './InfoPopup'

export function Info(props: { title?: string, tooltip?: string, text?: string }) {
    const ctx = useContext(infoPopupContext)
    return <div className={classes('Info')} title={props.tooltip} onClick={() => ctx.show(props.title ?? props.text ?? '', props.tooltip ?? '')}>{props.text}<Icon icon="info-circle" style="solid" /></div>
}
