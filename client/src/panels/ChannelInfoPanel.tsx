import * as React from 'react'
import { ControlPanelViewData, ControlPanelPage } from 'shared'
import { PanelField } from '../controls/PanelField'
import { Button } from '../controls/Button'

function copyOverlayURL() {
    const input = document.getElementById('overlay-url') as HTMLInputElement
    input.select()
    input.setSelectionRange(0, 99999)
    document.execCommand('copy')
}

export function ChannelInfoPanel(props: ControlPanelViewData & { page: ControlPanelPage }) {
    switch (props.page) {
        case ControlPanelPage.view:
            return <>
                <PanelField>
                    Welcome very much,&nbsp;<b>{props.username}</b>! Cheer u!!!
            </PanelField>
                <PanelField>
                    This is the control panel for&nbsp;<b>{props.channel}</b>!
            </PanelField>
                <hr />
                <PanelField label="Overlay URL">
                    <input id="overlay-url" type="text" readOnly value={`girldm.hawk.bar/${props.channel}/overlay/`} />&nbsp;<Button primary onClick={e => copyOverlayURL()}>Copy</Button>
                </PanelField>
            </>
        default:
            return <></>
    }
}
