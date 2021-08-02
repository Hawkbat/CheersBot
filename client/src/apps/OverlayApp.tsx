import { OverlayAppViewData, Icon, Counter, CounterVisibility, RedeemModeDisplay } from 'shared'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Bubble } from '../controls/Bubble'
import { channelAction, channelView, getChannelCSS } from '../utils'
import { Sound } from '../controls/Sound'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { useVTubeStudioConnection, useVTubeStudioProcessing } from '../vtstudio'
import { VTubeStudioBubble } from 'src/controls/VTubeStudioBubble'

declare const REFRESH_TIME: number
declare const CHANNEL_NAME: string

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
        console.error(e)
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
    const debug = props.modules.debug

    const displayModes: RedeemModeDisplay[] = modeQueue.state.modes.map(mode => {
        const config = modeQueue.config.modes.find(c => c.id === mode.configID)!
        const inModePeriod = mode.startTime && mode.duration && (Date.now() - mode.startTime) < mode.duration
        let msg = ''
        if (!mode.startTime) {
            msg = config.startText
        } else if (inModePeriod && mode.startTime && mode.duration) {
            const minutesLeft = Math.ceil((mode.duration - (Date.now() - mode.startTime)) / (60 * 1000))
            const minuteText = minutesLeft === 1 ? 'minute' : 'minutes'
            const secondsLeft = minutesLeft > 1 ? minutesLeft : Math.ceil((mode.duration - (Date.now() - mode.startTime)) / 1000)
            const secondText = minutesLeft > 1 ? minuteText : secondsLeft === 1 ? 'second' : 'seconds'
            msg = config.runningText
                .replace('[minutesLeft]', minutesLeft.toString())
                .replace('[minutes]', minuteText)
                .replace('[secondsLeft]', secondsLeft.toString())
                .replace('[seconds]', secondText)
        } else {
            msg = config.endText
        }
        let icon: Icon = config.emote ?? { type: 'logo', id: 'hawkbar', name: 'Hawkbar' }
        return {
            ...mode,
            icon,
            msg,
            showName: config.showUsername,
        }
    })

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

    const [logs, setLogs] = React.useState<{ time: number, msg: string }[]>([])

    React.useEffect(() => {
        window.addEventListener('error', e => setLogs(logs => [...logs.slice(-5), { time: Date.now(), msg: e.message }]))
        {
            const oldLog = console.log
            const oldError = console.error
                ; (console as any).log = (...args: any[]) => {
                    setLogs(logs => [...logs.slice(-5), { time: Date.now(), msg: args.join(' ') }])
                    oldLog(...args)
                }
                ; (console as any).error = (...args: any[]) => {
                    setLogs(logs => [...logs.slice(-5), { time: Date.now(), msg: args.join(' ') }])
                    oldError(...args)
                }
        }
    }, [])

    const vts = useVTubeStudioConnection({ ...vTubeStudio, type: 'overlay' })
    useVTubeStudioProcessing({ ...vTubeStudio, ...vts, enabled: vTubeStudio.config.useOverlay })

    return <div className="Overlay" style={{ ...getChannelCSS(props.modules.channelInfo.config), alignItems, justifyContent }}>
        <TransitionGroup component={null}>
            {customMessage.config.enabled ? customMessage.state.messages.filter(m => m.visible && m.message).map(m => <CSSTransition key={m.id} {...transitionProps}>
                <Bubble icon={m.emote ?? defaultEmote} msg={m.message} />
            </CSSTransition>) : null}
            {headpats.config.enabled && headpats.state.count > 0 ? <CSSTransition key='dm_headpats' {...transitionProps}>
                <Bubble icon={headpats.config.emote ?? defaultEmote} username={'' + headpats.state.count} msg={'headpat' + (headpats.state.count !== 1 ? 's' : '') + ' redeemed!'} />
            </CSSTransition> : null}
            {evilDm.config.enabled && evilDm.state.count > 0 && (evilDm.state.time + 10000) > Date.now() ? <CSSTransition key='evil_dm_' {...transitionProps}>
                <Bubble icon={evilDm.config.emote ?? defaultEmote} username={'evil_dm_'} msg={`has confessed to her crimes ${evilDm.state.count} time${evilDm.state.count === 1 ? '' : 's'}!`} />
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
                return config ? <Sound key={s.id} baseUrl={`/${CHANNEL_NAME}/uploads/`} config={config} onEnd={() => channelAction('sounds/remove-redeem', { id: s.id })} /> : null
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
            {debug.config.enabled && debug.config.overlayLogs ? logs.map(log => <CSSTransition key={log.time + log.msg} {...transitionProps}>
                <Bubble icon={defaultEmote} msg={log.msg} />
            </CSSTransition>) : null}
        </TransitionGroup>
    </div>
}
