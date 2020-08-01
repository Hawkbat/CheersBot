import * as React from 'react'
import { ControlPanelViewData, Icon, UserEventCondition } from 'shared'
import { PanelField } from '../controls/PanelField'
import { TwitchIcon } from '../controls/TwitchIcon'
import { TagList } from '../controls/TagList'
import { getStringValue } from '../utils'
import { post } from '../apps/ControlPanelApp'

async function mockEvent() {
    try {
        const type = getStringValue('event-type')
        const username = getStringValue('event-username')
        const message = getStringValue('event-message')
        const amount = getStringValue('event-amount')
        await post('actions/mock-event/', { type, username, message, amount })
    } catch (e) {
        console.error(e)
    }
}

async function reload() {
    try {
        await post('actions/reload/', {})
    } catch (e) {
        console.error(e)
    }
}

export function DebugPanel(props: ControlPanelViewData) {
    const [emote, setEmote] = React.useState<Icon | undefined>(undefined)
    const [conditions, setConditions] = React.useState<UserEventCondition[]>([])
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
            <select id="event-type">{Object.keys(props.redeemTypes).map((t, i) => <option key={i} value={props.redeemTypes[t]}>{t}</option>)}</select>
        </PanelField>
        <PanelField label="Event User">
            <input id="event-username" type="text" defaultValue="Anonymous" />
        </PanelField>
        <PanelField label="Event Message">
            <input id="event-message" type="text"></input>
        </PanelField>
        <PanelField label="Event Amount">
            <input id="event-amount" type="number" defaultValue="1" />
        </PanelField>
        <PanelField>
            <button className="primary" onClick={e => mockEvent()}>Generate fake event</button>
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
            <button onClick={e => reload()}>Force reload</button>&nbsp;all control panels and overlays
            </PanelField>
    </>
}
