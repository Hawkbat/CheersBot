import * as React from 'react'
import { ControlPanelAppViewData, ModuleDataType, ControlPanelPage, CounterVisibility, PanelViewDataProps } from 'shared'
import { Dropdown } from '../controls/Dropdown'
import { Button } from '../controls/Button'
import { PanelField } from '../controls/PanelField'
import { ExternalIconPicker } from '../controls/ExternalIconPicker'
import { channelAction, classes } from '../utils'
import { CounterEntry } from '../controls/CounterEntry'
import { TwitchRewardDropdown } from '../controls/TwitchRewardDropdown'
import { Fold } from '../controls/Fold'
import { Expander } from '../controls/Expander'


export function CountersPanel(props: ControlPanelAppViewData & ModuleDataType<'counters'> & PanelViewDataProps) {
    switch (props.page) {
        case ControlPanelPage.view:
            return <>
                <PanelField>
                    <div id="counters">
                        {props.config.configs.map(c => <CounterEntry key={c.id} config={c} value={{ count: 0, ...props.state.counters[c.id] }} />)}
                    </div>
                </PanelField>
            </>
        case ControlPanelPage.edit:
            return <>
                <hr />
                <PanelField>
                    <div id="counters">
                        {props.config.configs.map(c => <div key={c.id} className={classes('QueuedEvent')}>
                            <PanelField label="Reward" help="This is the channel point reward in Twitch that will trigger this counter to increase">
                                <TwitchRewardDropdown nullable selectedID={c.redeemID} selectedName={c.redeemName} onSelect={(id, name) => channelAction('counters/edit-config', { id: c.id, redeemID: id, redeemName: name })} />
                            </PanelField>
                            {(props.panel.items?.[c.id] ?? true) ? <>
                                <PanelField label="Emote" help="This emote is shown in the overlay when the counter changes">
                                    <ExternalIconPicker selected={c.emote} onSelect={v => channelAction('counters/edit-config', { id: c.id, emote: v })} />
                                </PanelField>
                                <PanelField label="Message" help="The text displayed while the counter is visible. You can use [maximum] to stand for the configured maximum count, if applicable">
                                    <input type="text" defaultValue={c.message} onChange={e => channelAction('counters/edit-config', { id: c.id, message: e.target.value })} />
                                </PanelField>
                                <PanelField label="Visibility" help="The condition for determining wther the counter should be visible">
                                    <Dropdown selected={c.visibility} options={Object.values(CounterVisibility).map(v => ({ value: v }))} onSelect={v => channelAction('counters/edit-config', { id: c.id, visibility: v as CounterVisibility })} />
                                </PanelField>
                                {c.visibility === CounterVisibility.whenRedeemed
                                    ? <PanelField label="Duration" help="The number of seconds that the counter will remain on screen after being redeemed" key={`${c.id}-visibility`}>
                                        <input type="number" step="any" defaultValue={c.duration} onChange={e => channelAction('counters/edit-config', { id: c.id, duration: parseInt(e.target.value) })} />&nbsp;seconds
                                </PanelField>
                                    : <></>}
                                <PanelField label="Maximum" help="A maximum number to count to before stopping. Leave blank for no maximum">
                                    <input type="number" defaultValue={c.maximum ?? undefined} onChange={e => channelAction('counters/edit-config', { id: c.id, maximum: e.target.value.length ? parseInt(e.target.value) : null })} />
                                </PanelField>
                                <PanelField>
                                    <Button onClick={() => channelAction('counters/delete-config', { id: c.id })}>Delete counter</Button>
                                </PanelField>
                            </> : <Fold />}
                            <Expander open={props.panel.items?.[c.id] ?? true} onToggle={open => props.onToggleItem(c.id, open)} />
                        </div>)}
                    </div>
                </PanelField>
                <PanelField>
                    <Button primary onClick={() => channelAction('counters/add-config', {})}>Add new counter</Button>
                </PanelField>
            </>
        default:
            return <></>
    }
}
