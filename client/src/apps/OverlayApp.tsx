import { OverlayAppViewData, Icon, Counter, CounterVisibility } from 'shared'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Bubble } from '../controls/Bubble'
import { channelView, getChannelCSS } from '../utils'

declare const REFRESH_TIME: number

let debounce = false
export async function refresh() {
    if (debounce) return
    debounce = true
    try {
        const data = await channelView('overlay-app')
        if (data) {
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
    const headpats = props.channelData.modules.headpats
    const evilDm = props.channelData.modules.evilDm
    const winLoss = props.channelData.modules.winLoss
    const modeQueue = props.channelData.modules.modeQueue
    const customMessage = props.channelData.modules.customMessage
    const counters = props.channelData.modules.counters

    return <div className="Overlay" style={getChannelCSS(props.channelData)}>
        {customMessage.state.messages.map(m => <Bubble key={m.id} visible={m.visible} icon={m.emote ?? defaultEmote} msg={m.message} />)}
        <Bubble visible={headpats.config.enabled && headpats.state.count > 0} icon={headpats.config.emote ?? defaultEmote} username={'' + headpats.state.count} msg={'headpat' + (headpats.state.count !== 1 ? 's' : '') + ' redeemed!'} />
        <Bubble visible={evilDm.config.enabled && evilDm.state.count > 0 && (evilDm.state.time + 10000) > Date.now()} icon={evilDm.config.emote ?? defaultEmote} username={'evil_dm_'} msg={`has confessed to her crimes ${evilDm.state.count} time${evilDm.state.count === 1 ? '' : 's'}!`} />
        <Bubble visible={winLoss.config.enabled && winLoss.state.display} icon={winLoss.state.losses > winLoss.state.wins ? winLoss.config.losingEmote ?? defaultEmote : winLoss.state.losses < winLoss.state.wins ? winLoss.config.winningEmote ?? defaultEmote : winLoss.config.tiedEmote ?? defaultEmote} username={''} msg={`<b>${winLoss.state.wins}</b> W - <b>${winLoss.state.losses}</b> L` + (winLoss.state.draws !== 0 ? ` - <b>${winLoss.state.draws}</b> D` : '')} />
        <Bubble visible={winLoss.config.enabled && winLoss.state.deaths > 0 && (winLoss.state.deathTime + 10000) > Date.now()} icon={winLoss.config.deathEmote ?? defaultEmote} username={'' + winLoss.state.deaths} msg={winLoss.state.deaths === 1 ? 'death so far!' : 'deaths so far!'} />
        {counters.config.configs.map(c => {
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
            const count = c.maximum !== null ? Math.min(c.maximum, counter.count) : counter.count
            const message = c.message.replace(/\[maximum\]/g, String(c.maximum))
            return <Bubble key={c.id} visible={counters.config.enabled && visible} icon={c.emote ?? defaultEmote} username={count.toString()} msg={message} />
        })}
        {props.modes.map(m => <Bubble key={m.id} visible={modeQueue.config.enabled && m.visible} icon={m.icon} username={m.showName ? m.userName : ''} msg={m.msg} />)}
    </div>
}
