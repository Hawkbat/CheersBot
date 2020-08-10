import * as React from 'react'
import { ModeQueueData, ControlPanelViewData } from 'shared'
import { PanelField } from '../controls/PanelField'
import { QueuedMode } from '../controls/QueuedMode'

export function ModeQueuePanel(props: ControlPanelViewData & ModeQueueData) {
    return <>
        <PanelField label="Timer Duration">
            <input id="timer-input" type="number" defaultValue="10" />&nbsp;minutes
            </PanelField>
        <hr />
        <PanelField>
            <div id="modes">
                {props.modes.length ? props.modes.map(e => <QueuedMode key={e.id} mode={e} />) : <i>No events currently queued</i>}
            </div>
        </PanelField>
        {props.data.modules.debug.enabled ? <></> : <audio id="alarm" src="/alarm.wav" loop />}
    </>
}
