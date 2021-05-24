import * as React from 'react'
import { ControlPanelAppViewData, ControlPanelPage, ModuleDataType } from 'shared'
import { PanelField } from '../controls/PanelField'
import { Button } from '../controls/Button'
import { channelAction } from '../utils'
import { Dropdown } from '../controls/Dropdown'

export function DebugPanel(props: ControlPanelAppViewData & ModuleDataType<'debug'> & { page: ControlPanelPage }) {

    const [configID, setConfigID] = React.useState(props.modules.modeQueue.config.modes[0]?.id ?? '')
    const [username, setUsername] = React.useState('Anonymous')
    const [message, setMessage] = React.useState('')
    const [amount, setAmount] = React.useState(1)

    const mockEvent = async () => {
        try {
            await channelAction('debug/mock', { configID, username, message, amount })
        } catch (e) {
            console.error(e)
        }
    }

    const reload = async () => {
        try {
            await channelAction('debug/reload', {})
        } catch (e) {
            console.error(e)
        }
    }

    switch (props.page) {
        case ControlPanelPage.view:
            return <>
                <PanelField label="Last Updated">
                    {props.updateTime.toLocaleTimeString()}
                </PanelField>
                <hr />
                <PanelField label="Timer Alarm">
                    <audio id="alarm" src="/alarm.wav" controls loop />
                </PanelField>
                <hr />
                <PanelField label="Event Type">
                    <Dropdown selected={configID} options={props.modules.modeQueue.config.modes.map(m => ({ value: m.id, text: m.redeemName }))} onSelect={v => setConfigID(v)} />
                </PanelField>
                <PanelField label="Event User">
                    <input id="event-username" type="text" value={username} onChange={e => setUsername(e.target.value)} />
                </PanelField>
                <PanelField label="Event Message">
                    <input id="event-message" type="text" value={message} onChange={e => setMessage(e.target.value)} />
                </PanelField>
                <PanelField label="Event Amount">
                    <input id="event-amount" type="number" value={amount} onChange={e => setAmount(e.target.valueAsNumber)} />
                </PanelField>
                <PanelField>
                    <Button primary onClick={e => mockEvent()}>Generate fake event</Button>
                </PanelField>
                <hr />
                <PanelField>
                    <Button onClick={e => reload()}>Force reload</Button>&nbsp;all control panels and overlays
        </PanelField>
            </>
        default:
            return <></>
    }
}
