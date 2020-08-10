import * as React from 'react'
import { ControlPanelViewData } from 'shared'
import { PanelField } from '../controls/PanelField'
import { getStringValue } from '../utils'
import { Button } from '../controls/Button'

function changeChannel() {
    try {
        const channel = getStringValue('channel-list')
        location.href = `/${channel}/`
    } catch (e) {
        console.error(e)
    }
}

function copyOverlayURL() {
    const input = document.getElementById('overlay-url') as HTMLInputElement
    input.select()
    input.setSelectionRange(0, 99999)
    document.execCommand('copy')
}

export function UserAndChannelPanel(props: ControlPanelViewData) {
    return <>
        <PanelField>
            Welcome very much,&nbsp;<b>{props.username}</b>! Cheer u!!!
            </PanelField>
        <PanelField>
            This is the control panel for&nbsp;<select id="channel-list" value={props.channel} onChange={e => changeChannel()}>{props.channels.map((c, i) => <option key={i} value={c}>{c}</option>)}</select>!
            </PanelField>
        <hr />
        <PanelField label="Overlay URL">
            <input id="overlay-url" type="text" readOnly value={`girldm.hawk.bar/${props.channel}/overlay/`} />&nbsp;<Button primary onClick={e => copyOverlayURL()}>Copy</Button>
        </PanelField>
    </>
}
