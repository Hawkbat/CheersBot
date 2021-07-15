import * as React from 'react'
import { ControlPanelAppViewData, ControlPanelPage, ModuleDataType, PanelViewDataProps } from 'shared'
import { PanelField } from '../controls/PanelField'
import { Button } from '../controls/Button'
import { channelAction } from '../utils'
import { Toggle } from '../controls/Toggle'
import { Dropdown } from '../controls/Dropdown'

function copyOverlayURL() {
    const input = document.getElementById('overlay-url') as HTMLInputElement
    input.select()
    input.setSelectionRange(0, 99999)
    document.execCommand('copy')
}

export function ChannelInfoPanel(props: ControlPanelAppViewData & ModuleDataType<'channelInfo'> & PanelViewDataProps) {
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
                <PanelField label="Overlay URL" key="Overlay URL" help="Add this as a browser source in OBS.">
                    <input id="overlay-url" type="text" readOnly value={overlayUrl} />&nbsp;<Button primary onClick={e => copyOverlayURL()}>Copy</Button>
                </PanelField>
            </>
        case ControlPanelPage.edit:
            return <>
                <hr />
                <PanelField label="Overlay Align" help="Where items in the overlay will be positioned within the browser source.">
                    <Dropdown selected={props.config.overlayCorner ?? 'top-left'} options={[{ value: 'top-left', text: 'Top Left' }, { value: 'top-right', text: 'Top Right' }, { value: 'bottom-left', text: 'Bottom Left' }, { value: 'bottom-right', text: 'Bottom Right' }]} onSelect={v => channelAction('channelinfo/set-config', { overlayCorner: v as any })} />
                </PanelField>
                <PanelField label="Accent Color" help="The primary color used for bold text and other accents.">
                    <input type="color" defaultValue={props.config.accentColor} onChange={e => channelAction('channelinfo/set-config', { accentColor: e.target.value })} />
                </PanelField>
                <PanelField label="Muted Color" help="The secondary color used for secondary and dimmer styling.">
                    <input type="color" defaultValue={props.config.mutedColor} onChange={e => channelAction('channelinfo/set-config', { mutedColor: e.target.value })} />
                </PanelField>
                <PanelField label="CommandPrefix" key="Command Prefix" help="The prefix used for all chat commands.">
                    <input type="text" defaultValue={props.config.commandPrefix} onChange={e => channelAction('channelinfo/set-config', { commandPrefix: e.target.value })} maxLength={1} />
                </PanelField>
                <PanelField label="Active Bot" help="The bot account responsible for sending messages in your chat.">
                    <Dropdown selected={props.config.activeBot} options={Object.keys(props.botAccess).map(k => ({ value: k }))} onSelect={v => channelAction('channelinfo/set-config', { activeBot: v })} />
                </PanelField>
                <hr />
                <PanelField label="Alpha Modules" help="Enable alpha/pre-alpha/experimental Cheers Bot modules, which are still in development and not ready for live use.">
                    <Toggle value={props.config.experimentalModules ?? false} onToggle={v => channelAction('channelinfo/set-config', { experimentalModules: v })} />
                </PanelField>
            </>
        default:
            return <></>
    }
}
