import * as React from 'react'
import { HeadpatData, ControlPanelViewData } from 'shared'
import { PanelField } from '../controls/PanelField'
import { post } from '../apps/ControlPanelApp'
import { getNumberValue, setNumberValue } from '../utils'
import { Button } from '../controls/Button'

async function clearHeadpats() {
    try {
        const count = getNumberValue('headpat-count')
        await post('actions/adjust-headpats/', { delta: -count })
    } catch (e) {
        console.error(e)
    }
}

async function completeHeadpats() {
    try {
        const count = getNumberValue('headpat-input')
        if (count) {
            await post('actions/adjust-headpats/', { delta: -count })
            setNumberValue('headpat-input', 1)
        }
    } catch (e) {
        console.error(e)
    }
}

export function HeadpatsPanel(props: ControlPanelViewData & HeadpatData) {
    return <>
        <PanelField>
            <span id="headpat-count">{props.count}</span>&nbsp;headpats redeemed!
        </PanelField>
        <PanelField>
            <Button primary onClick={e => completeHeadpats()}>Complete</Button>&nbsp;<input id="headpat-input" type="number" defaultValue="1" />&nbsp;headpats
        </PanelField>
        <PanelField>
            <Button onClick={e => clearHeadpats()}>Head has been thoroughly patted</Button>
        </PanelField>
    </>
}
