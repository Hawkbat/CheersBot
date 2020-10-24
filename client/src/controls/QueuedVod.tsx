import { VodQueueEntry, VodQueueConfigData } from 'shared'
import * as React from 'react'
import { PanelField } from './PanelField'
import { channelAction } from '../utils'
import { Button } from './Button'
import { Warning } from './Warning'

async function deleteEntry(id: string) {
    try {
        await channelAction('vodqueue/delete-entry', { id })
    } catch (e) {
        console.error(e)
    }
}

export function QueuedVod(props: { vod: VodQueueEntry, patchDate: number, config: VodQueueConfigData }) {
    const expired = isNaN(props.patchDate) || props.vod.time <= props.patchDate
    return <div className="QueuedVod">
        <PanelField>
            <span>{new Date(props.vod.time).toLocaleString()}</span>
            {expired ? <Warning tooltip="This VOD may have expired due to a new patch" /> : <></>}
            <div className="spacer" />
            &nbsp;<Button onClick={e => deleteEntry(props.vod.id)}>X</Button>
        </PanelField>
        <PanelField>
            Redeemed by&nbsp;<b>{props.vod.user.name}</b>
            <div className="spacer" />
            <span>Code: <b>{props.vod.context}</b></span>
        </PanelField>
    </div>
}
