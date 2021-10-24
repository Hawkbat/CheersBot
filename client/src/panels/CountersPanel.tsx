import * as React from 'react'
import { ControlPanelAppViewData, ModuleDataType, ControlPanelPage, CounterVisibility, PanelViewDataProps, safeParseInt } from 'shared'
import { Dropdown } from '../controls/Dropdown'
import { PanelField } from '../controls/PanelField'
import { ExternalIconPicker } from '../controls/ExternalIconPicker'
import { channelAction } from '../utils'
import { CounterEntry } from '../controls/CounterEntry'
import { ConfigList } from 'src/controls/ConfigList'


export function CountersPanel(props: ControlPanelAppViewData & ModuleDataType<'counters'> & PanelViewDataProps) {
    switch (props.page) {
        case ControlPanelPage.view:
            return <>
                <PanelField>
                    <div className="QueuedItemList">
                        {props.config.configs.map(c => <CounterEntry key={c.id} config={c} value={{ count: 0, ...props.state.counters[c.id] }} />)}
                    </div>
                </PanelField>
            </>
        case ControlPanelPage.edit:
            return <>
                <hr />
                <ConfigList configs={props.config.configs} label="Counters" configType="counter" panelData={props} addAction="counters/add-config" editAction="counters/edit-config" deleteAction="counters/delete-config" mockAction={null}>
                    {c => <>
                        <PanelField label="Emote" help="This emote is shown in the overlay when the counter changes.">
                            <ExternalIconPicker selected={c.emote} onSelect={v => channelAction('counters/edit-config', { id: c.id, emote: v })} />
                        </PanelField>
                        <PanelField label="Message" help="The text displayed while the counter is visible. You can use [maximum] to stand for the configured maximum count, if applicable.">
                            <input type="text" defaultValue={c.message} onChange={e => channelAction('counters/edit-config', { id: c.id, message: e.target.value })} />
                        </PanelField>
                        <PanelField label="Visibility" help="The condition for determining wther the counter should be visible.">
                            <Dropdown selected={c.visibility} options={Object.values(CounterVisibility).map(v => ({ value: v }))} onSelect={v => channelAction('counters/edit-config', { id: c.id, visibility: v })} />
                        </PanelField>
                        {c.visibility === CounterVisibility.whenRedeemed
                            ? <PanelField label="Duration" help="The number of seconds that the counter will remain on screen after being redeemed." key={`${c.id}-visibility`}>
                                <input type="number" step="any" defaultValue={c.duration} onChange={e => channelAction('counters/edit-config', { id: c.id, duration: safeParseInt(e.target.value) ?? c.duration })} />&nbsp;seconds
                                </PanelField>
                            : <></>}
                        <PanelField label="Maximum" help="A maximum number to count to before stopping. Leave blank for no maximum.">
                            <input type="number" defaultValue={c.maximum ?? undefined} onChange={e => channelAction('counters/edit-config', { id: c.id, maximum: e.target.value.length ? safeParseInt(e.target.value) ?? c.maximum : null })} />
                        </PanelField>
                    </>}
                </ConfigList>
            </>
        default:
            return <></>
    }
}
