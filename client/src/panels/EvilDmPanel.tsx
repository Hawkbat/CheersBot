import * as React from 'react'
import { ControlPanelAppViewData, ControlPanelPage, logError, ModuleDataType, PanelViewDataProps } from 'shared'
import { PanelField } from '../controls/PanelField'
import { getNumberValue, setNumberValue, channelAction } from '../utils'
import { Button } from '../controls/Button'
import { ExternalIconPicker } from '../controls/ExternalIconPicker'

async function clearEvil() {
    try {
        const count = getNumberValue('evil-count')
        await channelAction('evildm/adjust', { delta: -count })
    } catch (e) {
        logError(CHANNEL_NAME, 'evildm', e)
    }
}

async function adjustEvil() {
    try {
        const count = getNumberValue('evil-input')
        if (count) {
            await channelAction('evildm/adjust', { delta: count })
            setNumberValue('evil-input', 0)
        }
    } catch (e) {
        logError(CHANNEL_NAME, 'evildm', e)
    }
}

export function EvilDmPanel(props: ControlPanelAppViewData & ModuleDataType<'evilDm'> & PanelViewDataProps) {
    switch (props.page) {
        case ControlPanelPage.view:
            return <>
                <PanelField>
                    GirlDm has confessed to her crimes&nbsp;<span id="evil-count">{props.state.count}</span>&nbsp;times! Hecc!!!
        </PanelField>
                <PanelField>
                    <Button primary onClick={e => adjustEvil()}>Adjust</Button>&nbsp;counter by&nbsp;<input id="evil-input" type="number" defaultValue="0" />
                </PanelField>
                <PanelField>
                    <Button onClick={e => clearEvil()}>Reset evil counter</Button>
                </PanelField>
            </>
        case ControlPanelPage.edit:
            return <>
                <hr />
                <PanelField label="Emote" help="The emote displayed in the overlay when an evil say-something redeem happens.">
                    <ExternalIconPicker selected={props.config.emote} onSelect={v => channelAction('evildm/set-emote', { emote: v })} />
                </PanelField>
            </>
        default:
            return <></>
    }
}
