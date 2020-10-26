import * as React from 'react'
import { ControlPanelAppViewData, ControlPanelPage, ModuleDataType } from 'shared'
import { PanelField } from '../controls/PanelField'
import { Button } from '../controls/Button'
import { channelAction } from 'src/utils'

function copyOverlayURL() {
    const input = document.getElementById('overlay-url') as HTMLInputElement
    input.select()
    input.setSelectionRange(0, 99999)
    document.execCommand('copy')
}

export function ChannelInfoPanel(props: ControlPanelAppViewData & ModuleDataType<'channelInfo'> & { page: ControlPanelPage }) {
    const overlayUrl = `${location.origin}/${props.channel}/overlay/`
    switch (props.page) {
        case ControlPanelPage.view:
            return <>
                <PanelField>
                    {props.isGirlDm
                        ? <>Welcome very much,&nbsp;<b>{props.username}</b>! Cheer u!!!</>
                        : <>Welcome,&nbsp;<b>{props.username}</b>!</>}
                </PanelField>
                <PanelField>
                    This is the control panel for&nbsp;<b>{props.channel}</b>!
                </PanelField>
                <hr />
                <PanelField label="Overlay URL" key="Overlay URL" help="Add this as a browser source in OBS">
                    <input id="overlay-url" type="text" readOnly value={overlayUrl} />&nbsp;<Button primary onClick={e => copyOverlayURL()}>Copy</Button>
                </PanelField>
            </>
        case ControlPanelPage.edit:
            return <>
                <hr />
                <PanelField label="Accent Color" help="The primary color used for bold text and other accents">
                    <input type="color" defaultValue={props.config.accentColor} onChange={e => channelAction('channelinfo/set-accent-color', { color: e.target.value })} />
                </PanelField>
                <PanelField label="Muted Color" help="The secondary color used for secondary and dimmer styling">
                    <input type="color" defaultValue={props.config.mutedColor} onChange={e => channelAction('channelinfo/set-muted-color', { color: e.target.value })} />
                </PanelField>
                <PanelField label="CommandPrefix" key="Command Prefix" help="The prefix used for all chat commands">
                    <input type="text" defaultValue={props.config.commandPrefix} onChange={e => channelAction('channelinfo/set-command-prefix', { commandPrefix: e.target.value })} maxLength={1} />
                </PanelField>
            </>
        default:
            return <></>
    }
}
