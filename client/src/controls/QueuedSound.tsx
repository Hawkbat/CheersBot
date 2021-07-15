import { SoundConfig, SoundRedeem } from 'shared'
import * as React from 'react'
import { PanelField } from './PanelField'
import { Button } from './Button'
import { channelAction } from 'src/utils'

export function QueuedSound(props: { sound: SoundRedeem, config: SoundConfig }) {
    return <div className="QueuedItem">
        <PanelField>
            <i>{props.config.redeemName}</i>
            <div className="spacer" />
            <span>{new Date(props.sound.redeemTime).toLocaleTimeString()}</span>
            &nbsp;<Button onClick={() => channelAction('sounds/remove-redeem', { id: props.sound.id })}>X</Button>
        </PanelField>
        <PanelField>
            Redeemed by&nbsp;<b>{props.sound.userName}</b>
        </PanelField>
    </div>
}
