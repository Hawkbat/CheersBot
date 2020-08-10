import { OverlayViewData } from 'shared'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Mode } from '../controls/Mode'
import { getJSON } from '../utils'

declare const REFRESH_TIME: number

let debounce = false
export async function refresh() {
    if (debounce) return
    debounce = true
    try {
        const data = await getJSON<OverlayViewData>('../data/overlay/')
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
    const headpats = props.data.modules.headpats.count
    const evilCount = props.data.modules.evilDm.count
    return <div className="Overlay">
        <Mode visible={headpats > 0} icon={{ type: 'emote', id: "302176288", name: 'girldmHeadpat' }} username={'' + headpats} msg={'headpats redeemed!'} />
        <Mode visible={evilCount > 0 && (props.data.modules.evilDm.time + 10000) > Date.now()} icon={{ type: 'emote', id: '302186553', name: 'girldmWut' }} username={'evil_dm_'} msg={`has confessed to her crimes ${evilCount} time${evilCount === 1 ? '' : 's'}!`} />
        {props.modes.map(m => <Mode key={m.id} visible={m.visible} icon={m.icon} username={m.showName ? m.userName : ''} msg={m.msg} />)}
    </div>
}
