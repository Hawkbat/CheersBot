import { UserEvent, RedeemMode, ModeQueueModeConfig, safeParseFloat, logError } from 'shared'
import * as React from 'react'
import { PanelField } from './PanelField'
import { getNumberValue, channelAction } from '../utils'
import { Button } from './Button'

async function startMode(id: string, minutes: number) {
    try {
        await channelAction('modequeue/start', { id, duration: minutes * 60 * 1000 })
    } catch (e) {
        logError(CHANNEL_NAME, 'mode-queue', e)
    }
}

async function stopMode(id: string) {
    try {
        const alarm = document.getElementById('alarm') as HTMLAudioElement | null
        if (alarm) {
            alarm.pause()
            alarm.currentTime = 0
        }
    } catch (e) {
        logError(CHANNEL_NAME, 'mode-queue', e)
    }
}

async function clearMode(id: string) {
    try {
        const alarm = document.getElementById('alarm') as HTMLAudioElement | null
        if (alarm) {
            alarm.pause()
            alarm.currentTime = 0
        }
        await channelAction('modequeue/clear', { id })
    } catch (e) {
        logError(CHANNEL_NAME, 'mode-queue', e)
    }
}

function isAlarmRunning(): boolean {
    try {
        const alarm = document.getElementById('alarm') as HTMLAudioElement | null
        if (alarm) {
            return !alarm.paused
        }
    } catch (e) {
        logError(CHANNEL_NAME, 'modequeue', e)
    }
    return false
}

export function QueuedMode(props: { mode: RedeemMode, config: ModeQueueModeConfig }) {
    const timeLeft = (props.mode.duration ?? 0) - (Date.now() - (props.mode.startTime ?? 0))

    const [duration, setDuration] = React.useState(props.config.duration)

    return <div className="QueuedItem">
        <PanelField>
            <i>{props.config.redeemName}</i>
            <div className="spacer" />
            <span>{new Date(props.mode.redeemTime).toLocaleTimeString()}</span>
            &nbsp;<Button onClick={e => clearMode(props.mode.id)}>X</Button>
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
            <span>Duration:&nbsp;<input type="number" step="any" defaultValue={duration} onChange={e => setDuration(safeParseFloat(e.target.value) ?? duration)} />&nbsp;minutes</span>
            <div className="spacer" />
            <span>{
                !props.mode.startTime
                    ? <Button primary onClick={e => startMode(props.mode.id, duration)}>Start timer</Button>
                    : isAlarmRunning()
                        ? <Button onClick={e => stopMode(props.mode.id)}>Stop alarm</Button>
                        : <Button onClick={e => startMode(props.mode.id, duration)}>Restart timer</Button>
            }</span>
        </PanelField>
    </div>
}
