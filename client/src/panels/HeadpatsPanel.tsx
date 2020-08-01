import * as React from 'react'
import { ControlPanelViewData } from 'shared'
import { PanelField } from '../controls/PanelField'
import { post } from '../apps/ControlPanelApp'
import { getNumberValue, setNumberValue } from '../utils'

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

export function HeadpatsPanel(props: ControlPanelViewData) {
    return <>
        <PanelField>
            <span id="headpat-count">{props.headpats}</span>&nbsp;headpats redeemed!
        </PanelField>
        <PanelField>
            <button className="primary" onClick={e => completeHeadpats()}>Complete</button>&nbsp;<input id="headpat-input" type="number" defaultValue="1" />&nbsp;headpats
        </PanelField>
        <PanelField>
            <button onClick={e => clearHeadpats()}>Head has been thoroughly patted</button>
        </PanelField>
    </>
}
