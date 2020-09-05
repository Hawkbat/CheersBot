import { OverlayViewData } from 'shared'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Mode } from '../controls/Mode'
import { channelView } from '../utils'

declare const REFRESH_TIME: number

let debounce = false
export async function refresh() {
    if (debounce) return
    debounce = true
    try {
        const data = await channelView('overlay')
        if (data) {
            if (data.refreshTime !== REFRESH_TIME) location.reload()
            ReactDOM.render(<OverlayApp {...data} />, document.getElementById('app'))
        }
    } catch (e) {
        console.error(e)
    }
    debounce = false
}

export function OverlayApp(props: OverlayViewData) {
    const headpats = props.channelData.modules.headpats
    const evilDm = props.channelData.modules.evilDm
    const winLoss = props.channelData.modules.winLoss
    const modeQueue = props.channelData.modules.modeQueue
    return <div className="Overlay">
        {headpats.config.enabled ? <Mode visible={headpats.state.count > 0} icon={{ type: 'emote', id: "302176288", name: 'girldmHeadpat' }} username={'' + headpats.state.count} msg={'headpats redeemed!'} /> : <></>}
        {evilDm.config.enabled ? <Mode visible={evilDm.state.count > 0 && (evilDm.state.time + 10000) > Date.now()} icon={{ type: 'emote', id: '302186553', name: 'girldmWut' }} username={'evil_dm_'} msg={`has confessed to her crimes ${evilDm.state.count} time${evilDm.state.count === 1 ? '' : 's'}!`} /> : <></>}
        {winLoss.config.enabled && winLoss.state.display ? <Mode visible={true} icon={winLoss.state.losses > winLoss.state.wins ? { type: 'emote', id: '303414946', name: 'girldmWah' } : { type: 'emote', id: '303514962', name: 'girldmDab' }} username={''} msg={`<b>${winLoss.state.wins}</b> W - <b>${winLoss.state.losses}</b> L` + (winLoss.state.draws !== 0 ? ` - <b>${winLoss.state.draws}</b> D` : '')} /> : <></>}
        {winLoss.config.enabled ? <Mode visible={winLoss.state.deaths > 0 && (winLoss.state.deathTime + 10000) > Date.now()} icon={{ type: 'emote', id: '303415596', name: 'girldmDead' }} username={'' + winLoss.state.deaths} msg={winLoss.state.deaths === 1 ? 'death so far!' : 'deaths so far!'} /> : <></>}
        {modeQueue.config.enabled ? props.modes.map(m => <Mode key={m.id} visible={m.visible} icon={m.icon} username={m.showName ? m.userName : ''} msg={m.msg} />) : <></>}
    </div>
}
