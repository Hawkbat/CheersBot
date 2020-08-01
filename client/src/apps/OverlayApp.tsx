import { OverlayViewData } from 'shared'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Mode } from '../controls/Mode'
import { getJSON } from '../utils'

declare const REFRESH_ID: number

let debounce = false
export async function refresh() {
    if (debounce) return
    debounce = true
    try {
        const data = await getJSON<OverlayViewData>('../data/overlay/')
        if (data) {
            if (data.refreshID !== REFRESH_ID) location.reload()
            ReactDOM.render(<OverlayApp {...data} />, document.querySelector('main'))
        }
    } catch (e) {
        console.error(e)
    }
    debounce = false
}

export function OverlayApp(props: OverlayViewData) {
    return <div className="Overlay">
        <Mode visible={props.headpats > 0} icon={{ type: 'emote', id: "302176288", name: 'girldmHeadpat' }} username={'' + props.headpats} msg={'headpats redeemed!'} />
        <Mode visible={props.evilCount > 0 && (props.evilTime + 10000) > Date.now()} icon={{ type: 'emote', id: '302186553', name: 'girldmWut' }} username={'evil_dm_'} msg={`has confessed to her crimes ${props.evilCount} time${props.evilCount === 1 ? '' : 's'}!`} />
        {props.modes.map(m => <Mode key={m.id} visible={m.visible} icon={m.icon} username={m.showName ? m.userName : ''} msg={m.msg} />)}
    </div>
}
