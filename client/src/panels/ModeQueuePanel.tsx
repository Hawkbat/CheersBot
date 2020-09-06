import * as React from 'react'
import { ControlPanelAppViewData, ControlPanelPage, ModuleDataType } from 'shared'
import { PanelField } from '../controls/PanelField'
import { QueuedMode } from '../controls/QueuedMode'
import { Button } from 'src/controls/Button'
import { channelAction, classes } from 'src/utils'
import { TwitchIconPicker } from 'src/controls/TwitchIconPicker'
import { Toggle } from 'src/controls/Toggle'

export function ModeQueuePanel(props: ControlPanelAppViewData & ModuleDataType<'modeQueue'> & { page: ControlPanelPage }) {
    switch (props.page) {
        case ControlPanelPage.view:
            return <>
                <PanelField label="Timer Duration">
                    <input id="timer-input" type="number" defaultValue="10" />&nbsp;minutes
            </PanelField>
                <hr />
                <PanelField>
                    <div id="modes">
                        {props.state.modes.length ? props.state.modes.map(e => <QueuedMode key={e.id} mode={e} config={props.config.modes.find(m => m.id === e.configID)!} />) : <i>No modes currently queued</i>}
                    </div>
                </PanelField>
                {props.channelData.modules.debug.config.enabled ? <></> : <audio id="alarm" src="/alarm.wav" loop />}
            </>
        case ControlPanelPage.edit:
            return <>
                <PanelField>
                    <div id="modes">
                        {props.config.modes.map(m => <div key={m.id} className={classes('QueuedEvent')}>
                            <PanelField label="Redeem Name">
                                <input type="text" defaultValue={m.redeemName} onChange={e => channelAction('modequeue/edit-mode', { id: m.id, redeemName: e.target.value })} />
                            </PanelField>
                            <PanelField label="Emote">
                                <TwitchIconPicker selected={m.emote} options={props.icons} onSelect={v => channelAction('modequeue/edit-mode', { id: m.id, emote: v })} />
                            </PanelField>
                            <PanelField label="Show Username">
                                <Toggle value={m.showUsername} onToggle={v => channelAction('modequeue/edit-mode', { id: m.id, showUsername: v })} />
                            </PanelField>
                            <PanelField label="Start Text">
                                <input type="text" defaultValue={m.startText} onChange={e => channelAction('modequeue/edit-mode', { id: m.id, startText: e.target.value })} />
                            </PanelField>
                            <PanelField label="Running Text">
                                <input type="text" defaultValue={m.runningText} onChange={e => channelAction('modequeue/edit-mode', { id: m.id, runningText: e.target.value })} />
                            </PanelField>
                            <PanelField label="End Text">
                                <input type="text" defaultValue={m.endText} onChange={e => channelAction('modequeue/edit-mode', { id: m.id, endText: e.target.value })} />
                            </PanelField>
                            <PanelField>
                                <Button onClick={() => channelAction('modequeue/delete-mode', { id: m.id })}>Delete mode</Button>
                            </PanelField>
                        </div>)}
                    </div>
                </PanelField>
                <PanelField>
                    <Button primary onClick={() => channelAction('modequeue/add-mode', {})}>Add new mode</Button>
                </PanelField>
            </>
        default:
            return <></>
    }
}
