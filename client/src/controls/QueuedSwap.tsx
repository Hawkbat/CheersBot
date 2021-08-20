import { ModelSwapConfig, ModelSwapState } from 'shared'
import * as React from 'react'
import { PanelField } from './PanelField'
import { Button } from './Button'
import { channelAction } from '../utils'

export function QueuedSwap(props: { swap: ModelSwapState, config: ModelSwapConfig | undefined }) {
    return <div className="QueuedItem">
        <PanelField>
            <i>{props.config?.redeemName ?? 'Config Missing'}</i>
            <div className="spacer" />
            <span>{new Date(props.swap.redeemTime).toLocaleTimeString()}</span>
            &nbsp;<Button onClick={() => channelAction('vtstudio/complete-model-swap', { id: props.swap.id })}>X</Button>
        </PanelField>
        <PanelField>
            Redeemed by&nbsp;<b>{props.swap.userName}</b>
        </PanelField>
    </div>
}
