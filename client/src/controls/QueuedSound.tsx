import { SoundConfig, SoundRedeem } from 'shared'
import * as React from 'react'
import { PanelField } from './PanelField'

export function QueuedSound(props: { sound: SoundRedeem, config: SoundConfig }) {
    return <div className="QueuedSound">
        <PanelField>
            <i>{props.config.redeemName}</i>
            <div className="spacer" />
            <span>{new Date(props.sound.redeemTime).toLocaleTimeString()}</span>
        </PanelField>
        <PanelField>
            Redeemed by&nbsp;<b>{props.sound.userName}</b>
        </PanelField>
    </div>
}
