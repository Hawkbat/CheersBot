import * as React from 'react'
import { ControlPanelAppViewData, ControlPanelPage, ModuleDataType } from 'shared'
import { PanelField } from '../controls/PanelField'
import { QueuedMode } from '../controls/QueuedMode'
import { Button } from '../controls/Button'
import { channelAction, classes } from '../utils'
import { ExternalIconPicker } from '../controls/ExternalIconPicker'
import { Toggle } from '../controls/Toggle'

export function ModeQueuePanel(props: ControlPanelAppViewData & ModuleDataType<'modeQueue'> & { page: ControlPanelPage }) {
    const [tested, setTested] = React.useState('')

    const mockEvent = async (configID: string) => {
        try {
            await channelAction('debug/mock', { configID, username: 'Anonymous', message: '', amount: 1 })
            setTested(configID)
        } catch (e) {
            console.error(e)
        }
    }

    switch (props.page) {
        case ControlPanelPage.view:
            return <>
                <PanelField>
                    <div id="modes">
                        {props.state.modes.length ? props.state.modes.map(e => <QueuedMode key={e.id} mode={e} config={props.config.modes.find(m => m.id === e.configID)!} />) : <i>No modes currently queued</i>}
                    </div>
                </PanelField>
                {props.modules.debug.config.enabled ? <></> : <audio id="alarm" src="/alarm.wav" loop />}
            </>
        case ControlPanelPage.edit:
            return <>
                <hr />
                <PanelField>
                    <div id="modes">
                        {props.config.modes.map(m => <div key={m.id} className={classes('QueuedEvent')}>
                            <PanelField label="Reward Name" help="This should be the exact name displayed for the channel point reward in Twitch">
                                <input type="text" defaultValue={m.redeemName} onChange={e => channelAction('modequeue/edit-mode', { id: m.id, redeemName: e.target.value })} />
                            </PanelField>
                            <PanelField label="Emote" help="This emote is shown in the overlay when the mode is redeemed">
                                <ExternalIconPicker selected={m.emote} options={props.icons} onSelect={v => channelAction('modequeue/edit-mode', { id: m.id, emote: v })} />
                            </PanelField>
                            <PanelField label="Show Username" help="Whether the username of the person who redeemed the mode should be displayed in the overlay before the rest of the text">
                                <Toggle value={m.showUsername} onToggle={v => channelAction('modequeue/edit-mode', { id: m.id, showUsername: v })} />
                            </PanelField>
                            <PanelField label="Start Text" help="The text displayed when a mode is redeemed but before the timer is started">
                                <input type="text" defaultValue={m.startText} onChange={e => channelAction('modequeue/edit-mode', { id: m.id, startText: e.target.value })} />
                            </PanelField>
                            <PanelField label="Running Text" help="The text displayed while the timer is running. Use [minutesLeft] to stand for the number of minutes remaining and [minutes] to stand for either 'minute' or 'minutes' depending on how many minutes remain">
                                <input type="text" defaultValue={m.runningText} onChange={e => channelAction('modequeue/edit-mode', { id: m.id, runningText: e.target.value })} />
                            </PanelField>
                            <PanelField label="End Text" help="The text displayed when the timer finishes but before the mode is dismissed">
                                <input type="text" defaultValue={m.endText} onChange={e => channelAction('modequeue/edit-mode', { id: m.id, endText: e.target.value })} />
                            </PanelField>
                            <PanelField label="Timer Duration" help="The default number of minutes that timers for this mode will run">
                                <input type="number" defaultValue={m.duration} onChange={e => channelAction('modequeue/edit-mode', { id: m.id, duration: parseInt(e.target.value) })} />&nbsp;minutes
                            </PanelField>
                            <PanelField>
                                <Button onClick={() => mockEvent(m.id)}>Test mode</Button>
                                {m.id === tested ? <>&nbsp;<span>Success! Check the main tab!</span></> : <></>}
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
