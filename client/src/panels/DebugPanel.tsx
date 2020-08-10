import * as React from 'react'
import { ControlPanelViewData, Icon, UserEventCondition, DebugData, RedeemType } from 'shared'
import { PanelField } from '../controls/PanelField'
import { TwitchIcon } from '../controls/TwitchIcon'
import { TagList } from '../controls/TagList'
import { post } from '../apps/ControlPanelApp'
import { Button } from '../controls/Button'

export function DebugPanel(props: ControlPanelViewData & DebugData) {

    const [type, setType] = React.useState('' as RedeemType)
    const [username, setUsername] = React.useState('Anonymous')
    const [message, setMessage] = React.useState('')
    const [amount, setAmount] = React.useState(1)

    const [emote, setEmote] = React.useState<Icon | undefined>(undefined)
    const [conditions, setConditions] = React.useState<UserEventCondition[]>([])

    const mockEvent = async () => {
        try {
            await post('actions/mock-event/', { type, username, message, amount })
        } catch (e) {
            console.error(e)
        }
    }

    const reload = async () => {
        try {
            await post('actions/reload/', {})
        } catch (e) {
            console.error(e)
        }
    }

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
            <select id="event-type" value={type} onChange={e => setType(e.target.value as RedeemType)}>
                <option></option>
                {Object.keys(props.redeemTypes).map((t, i) => <option key={i} value={props.redeemTypes[t]}>{t}</option>)}
            </select>
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
        <PanelField label="Emote">
            <select onChange={e => setEmote(props.icons.find(i => i.id === e.target.value))} defaultValue={emote?.id}>
                <option></option>
                {props.icons.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            {emote ? <>&nbsp;<TwitchIcon icon={emote} size={1} /></> : <></>}
        </PanelField>
        <PanelField label="Show When">
            <TagList onSelect={v => setConditions([...conditions, v as UserEventCondition])} onDeselect={v => setConditions(cond => cond.filter(c => c !== v))} selected={conditions} options={Object.values(UserEventCondition).map(c => ({ text: c, value: c }))} />
        </PanelField>
        <hr />
        <PanelField>
            <Button onClick={e => reload()}>Force reload</Button>&nbsp;all control panels and overlays
        </PanelField>
    </>
}
