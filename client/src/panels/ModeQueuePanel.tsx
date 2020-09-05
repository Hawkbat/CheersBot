import * as React from 'react'
import { ControlPanelViewData, ControlPanelPage, ModuleDataType } from 'shared'
import { PanelField } from '../controls/PanelField'
import { QueuedMode } from '../controls/QueuedMode'

export function ModeQueuePanel(props: ControlPanelViewData & ModuleDataType<'modeQueue'> & { page: ControlPanelPage }) {
    switch (props.page) {
        case ControlPanelPage.view:
            return <>
                <PanelField label="Timer Duration">
                    <input id="timer-input" type="number" defaultValue="10" />&nbsp;minutes
            </PanelField>
                <hr />
                <PanelField>
                    <div id="modes">
                        {props.state.modes.length ? props.state.modes.map(e => <QueuedMode key={e.id} mode={e} />) : <i>No modes currently queued</i>}
                    </div>
                </PanelField>
                {props.channelData.modules.debug.config.enabled ? <></> : <audio id="alarm" src="/alarm.wav" loop />}
            </>
        default:
            return <></>
    }
}
