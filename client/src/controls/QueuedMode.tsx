import { UserEvent, RedeemMode, ModeQueueModeConfig } from 'shared'
import * as React from 'react'
import { PanelField } from './PanelField'
import { getNumberValue, channelAction } from '../utils'
import { Button } from './Button'

async function startMode(id: string) {
    try {
        const minutes = getNumberValue('timer-input')
        await channelAction('modequeue/start', { id, duration: minutes * 60 * 1000 })
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
        await channelAction('modequeue/clear', { id })
    } catch (e) {
        console.error(e)
    }
}

function isAlarmRunning(): boolean {
    try {
        const alarm = document.getElementById('alarm') as HTMLAudioElement
        return !alarm.paused
    } catch (e) {
        console.error(e)
    }
    return false
}

export function QueuedMode(props: { mode: RedeemMode, config: ModeQueueModeConfig }) {
    const timeLeft = (props.mode.duration ?? 0) - (Date.now() - (props.mode.startTime ?? 0))

    return <div className="QueuedEvent">
        <PanelField>
            <i>{props.config.redeemName}</i>
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
                    ? <Button primary onClick={e => startMode(props.mode.id)}>Start timer</Button>
                    : props.mode.startTime && timeLeft > 0
                        ? <Button primary onClick={e => startMode(props.mode.id)}>Restart timer</Button>
                        : <Button primary onClick={e => clearMode(props.mode.id)}>Dismiss event</Button>
            }</span>
            &nbsp;or&nbsp;
            <span>{
                !props.mode.startTime || timeLeft > 0
                    ? <Button onClick={e => clearMode(props.mode.id)}>dismiss event</Button>
                    : isAlarmRunning()
                        ? <Button onClick={e => stopMode(props.mode.id)}>stop alarm</Button>
                        : <Button onClick={e => startMode(props.mode.id)}>restart timer</Button>
            }</span>
        </PanelField>
    </div>
}
