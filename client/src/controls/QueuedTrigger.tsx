import { HotkeyTriggerState, TriggerHotkeyConfig } from 'shared'
import * as React from 'react'
import { PanelField } from './PanelField'
import { Button } from './Button'
import { channelAction } from '../utils'

export function QueuedTrigger(props: { trigger: HotkeyTriggerState, config: TriggerHotkeyConfig | undefined }) {
    return <div className="QueuedItem">
        <PanelField>
            <i>{props.config?.redeemName ?? 'Config Missing'}</i>
            <div className="spacer" />
            <span>{new Date(props.trigger.redeemTime).toLocaleTimeString()}</span>
            &nbsp;<Button onClick={() => channelAction('vtstudio/complete-hotkey-trigger', { id: props.trigger.id })}>X</Button>
        </PanelField>
        <PanelField>
            Redeemed by&nbsp;<b>{props.trigger.userName}</b>
        </PanelField>
    </div>
}
