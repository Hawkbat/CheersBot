import { ColorTintConfig, ColorTintState, } from 'shared'
import * as React from 'react'
import { PanelField } from './PanelField'
import { Button } from './Button'
import { channelAction } from '../utils'

export function QueuedTint(props: { tint: ColorTintState, config: ColorTintConfig | undefined }) {
    return <div className="QueuedItem">
        <PanelField>
            <i>{props.config?.redeemName ?? 'Config Missing'}</i>
            <div className="spacer" />
            <span>{new Date(props.tint.redeemTime).toLocaleTimeString()}</span>
            &nbsp;<Button onClick={() => channelAction('vtstudio/complete-color-tint', { id: props.tint.id })}>X</Button>
        </PanelField>
        <PanelField>
            Redeemed by&nbsp;<b>{props.tint.userName}</b>
        </PanelField>
    </div>
}
