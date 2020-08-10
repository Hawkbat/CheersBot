import * as React from 'react'
import { EvilDmData, ControlPanelViewData } from 'shared'
import { PanelField } from '../controls/PanelField'
import { post } from '../apps/ControlPanelApp'
import { getNumberValue, setNumberValue } from '../utils'
import { Button } from '../controls/Button'

async function clearEvil() {
    try {
        const count = getNumberValue('evil-count')
        await post('actions/adjust-evil/', { delta: -count })
    } catch (e) {
        console.error(e)
    }
}

async function adjustEvil() {
    try {
        const count = getNumberValue('evil-input')
        if (count) {
            await post('actions/adjust-evil/', { delta: count })
            setNumberValue('evil-input', 0)
        }
    } catch (e) {
        console.error(e)
    }
}

export function EvilDmPanel(props: ControlPanelViewData & EvilDmData) {
    return <>
        <PanelField>
            GirlDm has confessed to her crimes&nbsp;<span id="evil-count">{props.count}</span>&nbsp;times! Hecc!!!
        </PanelField>
        <PanelField>
            <Button primary onClick={e => adjustEvil()}>Adjust</Button>&nbsp;counter by&nbsp;<input id="evil-input" type="number" defaultValue="0" />
        </PanelField>
        <PanelField>
            <Button onClick={e => clearEvil()}>Reset evil counter</Button>
        </PanelField>
    </>
}
