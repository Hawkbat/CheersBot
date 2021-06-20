import * as React from 'react'
import { ControlPanelAppViewData, ControlPanelPage, ModuleDataType, PanelViewDataProps } from 'shared'
import { PanelField } from '../controls/PanelField'
import { getNumberValue, setNumberValue, channelAction } from '../utils'
import { Button } from '../controls/Button'
import { ExternalIconPicker } from '../controls/ExternalIconPicker'

async function clearHeadpats() {
    try {
        const count = getNumberValue('headpat-count')
        await channelAction('headpats/adjust', { delta: -count })
    } catch (e) {
        console.error(e)
    }
}

async function completeHeadpats() {
    try {
        const count = getNumberValue('headpat-input')
        if (count) {
            await channelAction('headpats/adjust', { delta: -count })
            setNumberValue('headpat-input', 1)
        }
    } catch (e) {
        console.error(e)
    }
}

export function HeadpatsPanel(props: ControlPanelAppViewData & ModuleDataType<'headpats'> & PanelViewDataProps) {
    switch (props.page) {
        case ControlPanelPage.view:
            return <>
                <PanelField>
                    <span id="headpat-count">{props.state.count}</span>&nbsp;headpats redeemed!
                </PanelField>
                <PanelField>
                    <Button primary onClick={e => completeHeadpats()}>Complete</Button>&nbsp;<input id="headpat-input" type="number" defaultValue="1" />&nbsp;headpats
                </PanelField>
                <PanelField>
                    <Button onClick={e => clearHeadpats()}>Head has been thoroughly patted</Button>
                </PanelField>
            </>
        case ControlPanelPage.edit:
            return <>
                <hr />
                <PanelField label="Emote" help="The emote displayed in the overlay when there are pending headpats">
                    <ExternalIconPicker selected={props.config.emote} onSelect={v => channelAction('headpats/set-emote', { emote: v })} />
                </PanelField>
            </>
        default:
            return <></>
    }
}
