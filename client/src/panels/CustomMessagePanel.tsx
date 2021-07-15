import * as React from 'react'
import { ControlPanelAppViewData, ModuleDataType, ControlPanelPage, PanelViewDataProps } from 'shared'
import { Button } from '../controls/Button'
import { PanelField } from '../controls/PanelField'
import { Toggle } from '../controls/Toggle'
import { ExternalIconPicker } from '../controls/ExternalIconPicker'
import { channelAction, classes } from '../utils'
import { Expander } from '../controls/Expander'
import { Fold } from '../controls/Fold'


export function CustomMessagePanel(props: ControlPanelAppViewData & ModuleDataType<'customMessage'> & PanelViewDataProps) {
    switch (props.page) {
        case ControlPanelPage.view:
            return <>
                <PanelField>
                    <div className="QueuedItemList">
                        {props.state.messages.length ? props.state.messages.map(m => <div key={m.id} className="QueuedItem">
                            <PanelField label="Visible" help="Whether the message should be displayed in the overlay.">
                                <Toggle value={m.visible} onToggle={v => channelAction('custommessage/edit-message', { id: m.id, visible: v })} />
                            </PanelField>
                            {(props.panel.items?.[m.id] ?? true) ? <>
                                <PanelField label="Emote" help="The emote shown in the overlay.">
                                    <ExternalIconPicker selected={m.emote} onSelect={v => channelAction('custommessage/edit-message', { id: m.id, emote: v })} />
                                </PanelField>
                                <PanelField label="Message" help="The text displayed in the overlay.">
                                    <input type="text" defaultValue={m.message} onChange={e => channelAction('custommessage/edit-message', { id: m.id, message: e.target.value })} />
                                </PanelField>
                                <PanelField>
                                    <Button onClick={() => channelAction('custommessage/delete-message', { id: m.id })}>Delete message</Button>
                                </PanelField>
                            </> : <Fold />}
                            <Expander open={props.panel.items?.[m.id] ?? true} onToggle={open => props.onToggleItem(m.id, open)} />
                        </div>) : <i>No messages added yet</i>}
                    </div>
                </PanelField>
                <PanelField>
                    <Button primary onClick={() => channelAction('custommessage/add-message', {})}>Add new message</Button>
                </PanelField>
            </>
        case ControlPanelPage.edit:
            return <>
            </>
        default:
            return <></>
    }
}
