import { UserEvent, RedeemMode } from 'shared'
import * as React from 'react'
import { post } from '../apps/ControlPanelApp'
import { PanelField } from '../controls/PanelField'
import { getNumberValue } from '../utils'

async function startMode(id: string) {
    try {
        const minutes = getNumberValue('timer-input')
        await post('actions/start-event/', { id, duration: minutes * 60 * 1000 })
    } catch (e) {
        console.error(e)
    }
}

async function stopMode(id: string) {
    try {
        const alarm = document.getElementById('alarm') as HTMLAudioElement
        alarm.pause()
        alarm.currentTime = 0
    } catch (e) {
        console.error(e)
    }
}

async function clearMode(id: string) {
    try {
        const alarm = document.getElementById('alarm') as HTMLAudioElement
        alarm.pause()
        alarm.currentTime = 0
        await post('actions/clear-event/', { id })
    } catch (e) {
        console.error(e)
    }
}

export function QueuedMode(props: { mode: RedeemMode }) {
    const timeLeft = (props.mode.duration ?? 0) - (Date.now() - (props.mode.startTime ?? 0))

    return <div className="QueuedEvent">
        <PanelField>
            <i>{props.mode.type}</i>
            <div className="spacer" />
            <span>{new Date(props.mode.redeemTime).toLocaleTimeString()}</span>
        </PanelField>
        <PanelField>
            Redeemed by&nbsp;<b>{props.mode.userName}</b>
            <div className="spacer" />
            <span>{
                props.mode.startTime && timeLeft > 0
                    ? `${Math.floor(timeLeft / (60 * 1000))}m ${('' + (Math.floor(timeLeft / 1000) % 60))}s`
                    : props.mode.startTime
                        ? 'Done!'
                        : ''
            }</span>
        </PanelField>
        <PanelField>
            <span>{
                !props.mode.startTime
                    ? <button className="primary" onClick={e => startMode(props.mode.id)}>Start timer</button>
                    : props.mode.startTime && timeLeft > 0
                        ? <button className="primary" onClick={e => startMode(props.mode.id)}>Restart timer</button>
                        : <button className="primary" onClick={e => clearMode(props.mode.id)}>Dismiss event</button>
            }</span>
            &nbsp;or&nbsp;
            <span>{
                !props.mode.startTime || timeLeft > 0
                    ? <button onClick={e => clearMode(props.mode.id)}>dismiss event</button>
                    : <button onClick={e => stopMode(props.mode.id)}>stop timer</button>
            }</span>
        </PanelField>
    </div>
}

export function QueuedEvent(props: { index: number, event: UserEvent }) {
    const timeLeft = (props.event.timer.duration ?? 0) - (Date.now() - (props.event.timer.startTime ?? 0))

    return <div className="QueuedEvent">
        <PanelField>
            <i>{props.event.type}{props.event.subType ? ' - ' + props.event.subType : ''}{props.event.amount > 1 ? ' x' + props.event.amount : ''}</i>
            <div className="spacer" />
            <span>{new Date(props.event.time).toLocaleTimeString()}</span>
        </PanelField>
        <PanelField>
            Redeemed by&nbsp;<b>{props.event.user.name}</b>
            <div className="spacer" />
            <span>{
                props.event.timer.startTime && timeLeft > 0
                    ? `${Math.floor(timeLeft / (60 * 1000))}m ${('' + (Math.floor(timeLeft / 1000) % 60))}s`
                    : props.event.timer.startTime
                        ? 'Done!'
                        : ''
            }</span>
        </PanelField>
        <PanelField>
            <span>{
                !props.event.timer.startTime
                    ? <button className="primary" onClick={e => startMode(props.event.id)}>Start timer</button>
                    : props.event.timer.startTime && timeLeft > 0
                        ? <button className="primary" onClick={e => startMode(props.event.id)}>Restart timer</button>
                        : <button className="primary" onClick={e => clearMode(props.event.id)}>Remove notification</button>
            }</span>
            or
            <span>{
                !props.event.timer.startTime || timeLeft > 0
                    ? <button onClick={e => clearMode(props.event.id)}>remove notification</button>
                    : <button onClick={e => stopMode(props.event.id)}>stop timer</button>
            }</span>
        </PanelField>
    </div>
}
