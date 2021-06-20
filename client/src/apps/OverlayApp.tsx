import { OverlayAppViewData, Icon, Counter, CounterVisibility } from 'shared'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Bubble } from '../controls/Bubble'
import { channelAction, channelView, getChannelCSS } from '../utils'
import { Sound } from '../controls/Sound'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { CSSTransitionProps } from 'react-transition-group/CSSTransition'

declare const REFRESH_TIME: number
declare const CHANNEL_NAME: string

let cachedData: OverlayAppViewData | undefined

let debounce = false
export async function refresh(reloadData: boolean) {
    if (debounce) return
    debounce = true
    try {
        const data = reloadData || !cachedData ? await channelView('overlay-app') : cachedData
        if (data) {
            cachedData = data
            if (data.refreshTime !== REFRESH_TIME) location.reload()
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

    const [finishedSounds, setFinishedSounds] = React.useState<Record<string, boolean>>({})

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

    return <div className="Overlay" style={{ ...getChannelCSS(props.modules.channelInfo.config), alignItems, justifyContent }}>
        <TransitionGroup component={null}>
            {customMessage.config.enabled ? customMessage.state.messages.filter(m => m.visible).map(m => <CSSTransition key={m.id} {...transitionProps}>
                <Bubble icon={m.emote ?? defaultEmote} msg={m.message} />
            </CSSTransition>) : null}
            {headpats.config.enabled && headpats.state.count > 0 ? <CSSTransition key='dm_headpats' {...transitionProps}>
                <Bubble icon={headpats.config.emote ?? defaultEmote} username={'' + headpats.state.count} msg={'headpat' + (headpats.state.count !== 1 ? 's' : '') + ' redeemed!'} />
            </CSSTransition> : null}
            {evilDm.config.enabled && evilDm.state.count > 0 && (evilDm.state.time + 10000) > Date.now() ? <CSSTransition key='evil_dm_' {...transitionProps}>
                <Bubble icon={evilDm.config.emote ?? defaultEmote} username={'evil_dm_'} msg={`has confessed to her crimes ${evilDm.state.count} time${evilDm.state.count === 1 ? '' : 's'}!`} />
            </CSSTransition> : null}
            {winLoss.config.enabled && winLoss.state.display ? <CSSTransition key='winloss' {...transitionProps}>
                <Bubble icon={winLoss.state.losses > winLoss.state.wins ? winLoss.config.losingEmote ?? defaultEmote : winLoss.state.losses < winLoss.state.wins ? winLoss.config.winningEmote ?? defaultEmote : winLoss.config.tiedEmote ?? defaultEmote} username={''} msg={`<b>${winLoss.state.wins}</b> W - <b>${winLoss.state.losses}</b> L` + (winLoss.state.draws !== 0 ? ` - <b>${winLoss.state.draws}</b> D` : '')} />
            </CSSTransition> : null}
            {winLoss.config.enabled && winLoss.state.deaths > 0 && (winLoss.state.deathTime + 10000) > Date.now() ? <CSSTransition key='deaths' {...transitionProps}>
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
            {sounds.config.enabled ? sounds.state.sounds.filter(s => !finishedSounds[s.id]).map(s => {
                const config = sounds.config.sounds.find(c => c.id === s.configID)
                return <CSSTransition key={s.id} {...transitionProps}>
                    <Bubble icon={config?.emote ?? defaultEmote} username={config?.showUsername ? s.userName : ''} msg={config?.showUsername ? `played ${config?.displayName}` : `Playing ${config?.displayName}`} />
                    <Sound url={`/${CHANNEL_NAME}/uploads/${config?.fileName}`} volume={config?.volume ?? 1} onEnd={() => {
                        setFinishedSounds(v => ({ ...v, [s.id]: true }))
                        channelAction('sounds/remove-redeem', { id: s.id })
                    }} />
                </CSSTransition>
            }) : null}
            {modeQueue.config.enabled ? props.modes.filter(m => m.visible).map(m => <CSSTransition key={m.id} {...transitionProps}>
                <Bubble icon={m.icon} username={m.showName ? m.userName : ''} msg={m.msg} />
            </CSSTransition>) : null}
        </TransitionGroup>
    </div>
}
