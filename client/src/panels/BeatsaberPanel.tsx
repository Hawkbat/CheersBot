import * as React from 'react'
import { ControlPanelAppViewData, ControlPanelPage, ModuleDataType, PanelViewDataProps, safeParseInt } from 'shared'
import { PanelField } from '../controls/PanelField'
import { channelAction } from '../utils'
import { Toggle } from '../controls/Toggle'
import { Alert } from 'src/controls/Alert'

export function BeatsaberPanel(props: ControlPanelAppViewData & ModuleDataType<'beatsaber'> & PanelViewDataProps) {

    switch (props.page) {
        case ControlPanelPage.view:
            return <>

            </>
        case ControlPanelPage.edit:
            return <>
                <hr />
                <PanelField>
                    <Alert type="info">
                        <span>
                            This module requires the <a href="https://github.com/kOFReadie/BSDataPuller">BSDataPuller</a> mod and all of its dependencies to be installed in Beat Saber. I recommend using <a href="https://github.com/Assistant/ModAssistant">Mod Assistant</a> to download and install it.
                        </span>
                    </Alert>
                </PanelField>
                <hr />
                <PanelField label="Debug Overlay" help="Whether to show an indicator of the Beat Saber connection status in the overlay. Useful for checking connection issues.">
                    <Toggle value={props.config.debugOverlay} onToggle={v => channelAction('beatsaber/set-config', { debugOverlay: v })} />
                </PanelField>
                <PanelField label="API Host" help="The URL to connect to Beat Saber at. When using Cheers Bot on the same device as Beat Saber you will want to leave this as 'localhost'.">
                    <input type="text" value={props.config.apiHost} onChange={e => channelAction('beatsaber/set-config', { apiHost: e.target.value || props.config.apiHost })} />
                </PanelField>
                <PanelField label="API Port" help="The port to connect to Beat Saber at. This will likely never need changing.">
                    <input type="number" step="any" value={props.config.apiPort} onChange={e => channelAction('beatsaber/set-config', { apiPort: safeParseInt(e.target.value) ?? props.config.apiPort })} />
                </PanelField>
            </>
        default:
            return <></>
    }
}
