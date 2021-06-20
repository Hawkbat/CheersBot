import * as React from 'react'
import { ControlPanelAppViewData, ControlPanelPage, ModuleDataType, PanelViewDataProps } from 'shared'
import { PanelField } from '../controls/PanelField'
import { QueuedMode } from '../controls/QueuedMode'
import { Button } from '../controls/Button'
import { channelAction, classes } from '../utils'
import { ExternalIconPicker } from '../controls/ExternalIconPicker'
import { Toggle } from '../controls/Toggle'
import { TwitchRewardDropdown } from '../controls/TwitchRewardDropdown'
import { Expander } from '../controls/Expander'
import { Fold } from '../controls/Fold'

export function ModeQueuePanel(props: ControlPanelAppViewData & ModuleDataType<'modeQueue'> & PanelViewDataProps) {
    const [tested, setTested] = React.useState('')

    const mockEvent = async (configID: string) => {
        try {
            await channelAction('modequeue/mock', { configID, username: 'Anonymous' })
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
                <audio id="alarm" src="/alarm.wav" loop />
            </>
        case ControlPanelPage.edit:
            return <>
                <hr />
                <PanelField label="Alarm Volume" help="The volume of the alarm when a timer ends. Set to 0 to mute the alarm">
                    <input type="range" min="0" max="1" step="any" defaultValue={props.config.alarmVolume ?? 1} onChange={e => channelAction('modequeue/set-alarm-volume', { volume: e.target.valueAsNumber })} />
                                &nbsp;{Math.round((props.config.alarmVolume ?? 1) * 100)}%
                </PanelField>
                <PanelField>
                    <div id="modes">
                        {props.config.modes.map(m => <div key={m.id} className={classes('QueuedEvent')}>
                            <PanelField label="Reward" help="This is the channel point reward in Twitch that will trigger this mode">
                                <TwitchRewardDropdown nullable selectedID={m.redeemID} selectedName={m.redeemName} onSelect={(id, name) => channelAction('modequeue/edit-mode', { id: m.id, redeemID: id, redeemName: name })} />
                            </PanelField>
                            {(props.panel.items?.[m.id] ?? true) ? <>
                                <PanelField label="Emote" help="This emote is shown in the overlay when the mode is redeemed">
                                    <ExternalIconPicker selected={m.emote} onSelect={v => channelAction('modequeue/edit-mode', { id: m.id, emote: v })} />
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
                                <PanelField label="Auto-Start" help="Whether the timer should automatically start when the mode is redeemed">
                                    <Toggle value={m.autoStart ?? false} onToggle={v => channelAction('modequeue/edit-mode', { id: m.id, autoStart: v })} />
                                </PanelField>
                                <PanelField label="Auto-Dismiss" help="Whether the mode should be automatically dismissed when the timer ends">
                                    <Toggle value={m.autoEnd ?? false} onToggle={v => channelAction('modequeue/edit-mode', { id: m.id, autoEnd: v })} />
                                </PanelField>
                                <PanelField>
                                    <Button onClick={() => mockEvent(m.id)}>Test mode</Button>
                                    {m.id === tested ? <>&nbsp;<span>Success! Check the main tab!</span></> : <></>}
                                </PanelField>
                                <PanelField>
                                    <Button onClick={() => channelAction('modequeue/delete-mode', { id: m.id })}>Delete mode</Button>
                                </PanelField>
                            </> : <Fold />}
                            <Expander open={props.panel.items?.[m.id] ?? true} onToggle={open => props.onToggleItem(m.id, open)} />
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
