import { OverlayAppViewData, Icon, Counter, CounterVisibility, RedeemModeDisplay, logError, peekLogBuffer, popLogBuffer } from 'shared'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Bubble } from '../controls/Bubble'
import { channelAction, channelView, formatTime, getChannelCSS, useRepeatingEffect } from '../utils'
import { Sound } from '../controls/Sound'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { useVTubeStudioConnection, useVTubeStudioProcessing } from '../vtstudio'
import { VTubeStudioBubble } from 'src/controls/VTubeStudioBubble'
import { useBeatsaberConnection } from 'src/beatsaber'

let cachedData: OverlayAppViewData | undefined
let pendingViewPromise: Promise<OverlayAppViewData | undefined> | undefined

let debounce = false
export async function refresh(reloadData: boolean) {
    if (debounce) return
    debounce = true
    try {
        const data = reloadData || !cachedData ? await (pendingViewPromise ?? (pendingViewPromise = channelView('overlay-app'))) : cachedData
        pendingViewPromise = undefined
        if (data) {
            cachedData = data
            if (reloadData && data.refreshTime !== REFRESH_TIME) location.reload()
            ReactDOM.render(<OverlayApp {...data} />, document.getElementById('app'))
        }
    } catch (e) {
        logError(CHANNEL_NAME, 'overlay', 'Error refreshing overlay', e)
    }
    debounce = false
}

const defaultEmote: Icon = { id: 'hawkbar', name: 'Hawkbar', type: 'logo' }

export function OverlayApp(props: OverlayAppViewData) {
    const headpats = props.modules.headpats
    const evilDm = props.modules.evilDm
    const winLoss = props.modules.winLoss
    const modeQueue = props.modules.modeQueue
    const customMessage = props.modules.customMessage
    const counters = props.modules.counters
    const sounds = props.modules.sounds
    const vTubeStudio = props.modules.vtubeStudio
    const subathon = props.modules.subathon
    const beatsaber = props.modules.beatsaber
    const debug = props.modules.debug

    const displayModes: RedeemModeDisplay[] = modeQueue.state.modes.map(mode => {
        const config = modeQueue.config.modes.find(c => c.id === mode.configID)
        const inModePeriod = mode.startTime && mode.duration && (Date.now() - mode.startTime) < mode.duration
        let msg = ''
        if (!mode.startTime) {
            msg = config?.startText ?? ''
        } else if (inModePeriod && mode.startTime && mode.duration) {
            const minutesLeft = Math.ceil((mode.duration - (Date.now() - mode.startTime)) / (60 * 1000))
            const minuteText = minutesLeft === 1 ? 'minute' : 'minutes'
            const secondsLeft = minutesLeft > 1 ? minutesLeft : Math.ceil((mode.duration - (Date.now() - mode.startTime)) / 1000)
            const secondText = minutesLeft > 1 ? minuteText : secondsLeft === 1 ? 'second' : 'seconds'
            msg = (config?.runningText ?? '')
                .replace('[minutesLeft]', minutesLeft.toString())
                .replace('[minutes]', minuteText)
                .replace('[secondsLeft]', secondsLeft.toString())
                .replace('[seconds]', secondText)
        } else {
            msg = config?.endText ?? ''
        }
        let icon: Icon = config?.emote ?? { type: 'logo', id: 'hawkbar', name: 'Hawkbar' }
        return {
            ...mode,
            icon,
            msg,
            showName: config?.showUsername ?? false,
        }
    })

    const getSubathonTimer = () => {
        const timeInCurrentPeriod = Date.now() - (subathon.state.startTime ?? Date.now())
        const actualTimeRemaining = Math.max(0, subathon.state.remainingTime - timeInCurrentPeriod)
        return formatTime(actualTimeRemaining)
    }

    const getSubathonMsg = () => {
        const timeInCurrentPeriod = Date.now() - (subathon.state.startTime ?? Date.now())
        const actualTimeRemaining = Math.max(0, subathon.state.remainingTime - timeInCurrentPeriod)
        const totalTimePassed = subathon.state.elapsedTime + timeInCurrentPeriod
        if (actualTimeRemaining <= 0) return subathon.config.endText
        if (totalTimePassed > 0) return subathon.config.runningText
        return subathon.config.startText
    }

    const alignItems = props.modules.channelInfo.config.overlayCorner?.includes('right') ? 'flex-end' : 'flex-start'
    const justifyContent = props.modules.channelInfo.config.overlayCorner?.includes('bottom') ? 'flex-end' : 'flex-start'

    const transitionProps = {
        timeout: 500,
        classNames: 't',
        enter: true,
        exit: true,
        appear: true,
        mountOnEnter: true,
        unmountOnExit: true,
    }

    React.useEffect(() => {
        window.addEventListener('error', e => logError(CHANNEL_NAME, 'overlay', e.message, e.filename, e.lineno, e.colno, e.error))
    }, [])

    useRepeatingEffect(React.useCallback(async () => {
        await channelAction('debug/send-logs', { logs: popLogBuffer() })
    }, []), 60 * 1000, false)

    const bs = useBeatsaberConnection(beatsaber)

    const vts = useVTubeStudioConnection({ ...vTubeStudio, type: 'overlay' })
    useVTubeStudioProcessing({ ...vTubeStudio, ...vts, enabled: vTubeStudio.config.useOverlay })

    return <div className="Overlay" style={{ ...getChannelCSS(props.modules.channelInfo.config), alignItems, justifyContent }}>
        <TransitionGroup component={null}>
            {props.tokenInvalid ? <CSSTransition key="badtoken" {...transitionProps}>
                <Bubble icon={defaultEmote} msg="Twitch connection has expired. Reconnect your channel account." />
            </CSSTransition> : null}
            {customMessage.config.enabled ? customMessage.state.messages.filter(m => m.visible && m.message).map(m => <CSSTransition key={m.id} {...transitionProps}>
                <Bubble icon={m.emote ?? defaultEmote} msg={m.message} />
            </CSSTransition>) : null}
            {headpats.config.enabled && headpats.state.count > 0 ? <CSSTransition key='dm_headpats' {...transitionProps}>
                <Bubble icon={headpats.config.emote ?? defaultEmote} username={'' + headpats.state.count} msg={'headpat' + (headpats.state.count !== 1 ? 's' : '') + ' redeemed!'} />
            </CSSTransition> : null}
            {evilDm.config.enabled && evilDm.state.count > 0 && (evilDm.state.time + 10000) > Date.now() ? <CSSTransition key='evil_dm_' {...transitionProps}>
                <Bubble icon={evilDm.config.emote ?? defaultEmote} username={'evil_dm_'} msg={`has confessed to her crimes ${evilDm.state.count} time${evilDm.state.count === 1 ? '' : 's'}!`} />
            </CSSTransition> : null}
            {beatsaber.config.enabled && bs.mapConnected && bs.mapData !== null && bs.mapData.InLevel ? <CSSTransition key='beatsabermap' {...transitionProps}>
                <Bubble icon={{ type: 'url', id: bs.mapData.coverImage, name: bs.mapData.SongName }} username={bs.mapData.SongName} msg={`${bs.mapData.SongSubName} - ${bs.mapData.SongAuthor} [${bs.mapData.MapType}][${bs.mapData.CustomDifficultyLabel ? bs.mapData.CustomDifficultyLabel : bs.mapData.Difficulty}]`} />
            </CSSTransition> : null}
            {beatsaber.config.enabled && bs.liveConnected && bs.mapData !== null && bs.liveData !== null ? <CSSTransition key='beatsaberlive' {...transitionProps}>
                <Bubble icon={{ type: 'url', id: bs.mapData.coverImage, name: bs.mapData.SongName }} username={bs.liveData.Rank} msg={`${bs.liveData.Combo} / ${bs.liveData.FullCombo} ${Math.round(bs.liveData.Accuracy * 100)}% ${formatTime(bs.liveData.TimeElapsed * 1000)} / ${formatTime(bs.mapData.Length * 1000)}`} />
            </CSSTransition> : null}
            {beatsaber.config.enabled && beatsaber.config.debugOverlay ? <CSSTransition key='beatsaberdebug' {...transitionProps}>
                <Bubble icon={defaultEmote} username='Beat Saber' msg={`Map Data: ${bs.mapConnected ? '' : 'dis'}connected; Live Data: ${bs.liveConnected ? '' : 'dis'}connected`} />
            </CSSTransition> : null}
            {winLoss.config.enabled && winLoss.state.display && (winLoss.state.wins !== 0 || winLoss.state.draws !== 0 || winLoss.state.losses !== 0) ? <CSSTransition key='winloss' {...transitionProps}>
                <Bubble icon={winLoss.state.losses > winLoss.state.wins ? winLoss.config.losingEmote ?? defaultEmote : winLoss.state.losses < winLoss.state.wins ? winLoss.config.winningEmote ?? defaultEmote : winLoss.config.tiedEmote ?? defaultEmote} username={''} msg={`<b>${winLoss.state.wins}</b> W - <b>${winLoss.state.losses}</b> L` + (winLoss.state.draws !== 0 ? ` - <b>${winLoss.state.draws}</b> D` : '')} />
            </CSSTransition> : null}
            {winLoss.config.enabled && winLoss.state.display && (winLoss.config.deathDuration === 0 || (winLoss.state.deaths > 0 && (winLoss.state.deathTime + winLoss.config.deathDuration * 1000) > Date.now())) ? <CSSTransition key='deaths' {...transitionProps}>
                <Bubble icon={winLoss.config.deathEmote ?? defaultEmote} username={'' + winLoss.state.deaths} msg={winLoss.state.deaths === 1 ? 'death so far!' : 'deaths so far!'} />
            </CSSTransition> : null}
            {counters.config.enabled ? counters.config.configs.filter(c => {
                const counter: Counter = {
                    count: 0,
                    ...counters.state.counters[c.id],
                }
                let visible = false
                switch (c.visibility) {
                    case CounterVisibility.always:
                        visible = true
                        break
                    case CounterVisibility.nonZero:
                        visible = counter.count !== 0
                        break
                    case CounterVisibility.whenRedeemed:
                        visible = ((counter.time ?? 0) + (c.duration * 1000)) > Date.now()
                        break
                    case CounterVisibility.never:
                        break
                }
                return visible
            }).map(c => {
                const counter: Counter = {
                    count: 0,
                    ...counters.state.counters[c.id],
                }
                const count = c.maximum !== null ? Math.min(c.maximum, counter.count) : counter.count
                const message = c.message.replace(/\[maximum\]/g, String(c.maximum))
                return <CSSTransition key={c.id} {...transitionProps}>
                    <Bubble icon={c.emote ?? defaultEmote} username={count.toString()} msg={message} />
                </CSSTransition>
            }) : null}
            {sounds.config.enabled ? sounds.state.sounds.map(s => {
                const config = sounds.config.sounds.find(c => c.id === s.configID)
                return <CSSTransition key={s.id} {...transitionProps}>
                    <Bubble icon={config?.emote ?? defaultEmote} username={config?.showUsername ? s.userName : ''} msg={config?.showUsername ? `played ${config?.displayName}` : `Playing ${config?.displayName}`} />
                </CSSTransition>
            }) : null}
            {sounds.config.enabled ? sounds.state.sounds.map(s => {
                const config = sounds.config.sounds.find(c => c.id === s.configID)
                const blocked = config?.blocking && s !== sounds.state.sounds.find(o => sounds.config.sounds.find(c => c.id === o.configID)?.blocking)
                return config && !blocked ? <Sound key={s.id} baseUrl={`/${CHANNEL_NAME}/uploads/`} config={config} onEnd={() => channelAction('sounds/remove-redeem', { id: s.id })} /> : null
            }) : null}
            {modeQueue.config.enabled ? displayModes.filter(m => m.visible && m.msg).map(m => <CSSTransition key={m.id} {...transitionProps}>
                <Bubble icon={m.icon} username={m.showName ? m.userName : ''} msg={m.msg} />
            </CSSTransition>) : null}
            {vTubeStudio.config.enabled ? vTubeStudio.state.swaps.filter(s => {
                return !!vTubeStudio.config.swaps.find(c => c.id === s.configID)?.message
            }).map(s => {
                const config = vTubeStudio.config.swaps.find(c => c.id === s.configID)
                return <CSSTransition key={s.id} {...transitionProps}>
                    <Bubble icon={config?.emote ?? defaultEmote} username={config?.showUsername ? s.userName : ''} msg={config?.message ?? ''} />
                </CSSTransition>
            }) : null}
            {vTubeStudio.config.enabled ? vTubeStudio.state.triggers.filter(t => {
                return !!vTubeStudio.config.triggers.find(c => c.id === t.configID)?.message
            }).map(t => {
                const config = vTubeStudio.config.triggers.find(c => c.id === t.configID)
                return <CSSTransition key={t.id} {...transitionProps}>
                    <Bubble icon={config?.emote ?? defaultEmote} username={config?.showUsername ? t.userName : ''} msg={config?.message ?? ''} />
                </CSSTransition>
            }) : null}
            {vTubeStudio.config.enabled ? vTubeStudio.state.tints.filter(t => {
                return !!vTubeStudio.config.tints.find(c => c.id === t.configID)?.message
            }).map(t => {
                const config = vTubeStudio.config.tints.find(c => c.id === t.configID)
                return <CSSTransition key={t.id} {...transitionProps}>
                    <Bubble icon={config?.emote ?? defaultEmote} username={config?.showUsername ? t.userName : ''} msg={config?.message ?? ''} />
                </CSSTransition>
            }) : null}
            {vTubeStudio.config.enabled && vTubeStudio.config.debugOverlay ? <CSSTransition key='vtsdebug' {...transitionProps}>
                <VTubeStudioBubble connected={vts.connected} apiError={String(vts.apiError ?? '')} readyState={vts.client.ws.readyState} />
            </CSSTransition> : null}
            {subathon.config.enabled && subathon.state.active ? <CSSTransition key='subathon' {...transitionProps}>
                <Bubble icon={subathon.config.icon ?? defaultEmote} username={getSubathonTimer()} msg={getSubathonMsg()} />
            </CSSTransition> : null}
            {debug.config.enabled && debug.config.overlayLogs ? peekLogBuffer().slice(-5).map(log => <CSSTransition key={log.join(' ')} {...transitionProps}>
                <Bubble icon={defaultEmote} msg={log.join(' ')} />
            </CSSTransition>) : null}
        </TransitionGroup>
    </div>
}
