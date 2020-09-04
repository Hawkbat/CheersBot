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
    const headpats = props.channelData.modules.headpats.count
    const evilCount = props.channelData.modules.evilDm.count
    const winLoss = props.channelData.modules.winLoss
    return <div className="Overlay">
        {props.channelData.modules.headpats.enabled ? <Mode visible={headpats > 0} icon={{ type: 'emote', id: "302176288", name: 'girldmHeadpat' }} username={'' + headpats} msg={'headpats redeemed!'} /> : <></>}
        {props.channelData.modules.evilDm.enabled ? <Mode visible={evilCount > 0 && (props.channelData.modules.evilDm.time + 10000) > Date.now()} icon={{ type: 'emote', id: '302186553', name: 'girldmWut' }} username={'evil_dm_'} msg={`has confessed to her crimes ${evilCount} time${evilCount === 1 ? '' : 's'}!`} /> : <></>}
        {winLoss.enabled && winLoss.display ? <Mode visible={true} icon={winLoss.losses > winLoss.wins ? { type: 'emote', id: '303414946', name: 'girldmWah' } : { type: 'emote', id: '303514962', name: 'girldmDab' }} username={''} msg={`<b>${winLoss.wins}</b> W - <b>${winLoss.losses}</b> L` + (winLoss.draws !== 0 ? ` - <b>${winLoss.draws}</b> D` : '')} /> : <></>}
        {winLoss.enabled && winLoss.display ? <Mode visible={winLoss.deaths > 0 && (winLoss.deathTime + 10000) > Date.now()} icon={{ type: 'emote', id: '303415596', name: 'girldmDead' }} username={'' + winLoss.deaths} msg={winLoss.deaths === 1 ? 'death so far!' : 'deaths so far!'} /> : <></>}
        {props.channelData.modules.modeQueue.enabled ? props.modes.map(m => <Mode key={m.id} visible={m.visible} icon={m.icon} username={m.showName ? m.userName : ''} msg={m.msg} />) : <></>}
    </div>
}
