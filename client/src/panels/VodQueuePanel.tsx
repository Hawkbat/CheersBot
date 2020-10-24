import * as React from 'react'
import { ControlPanelAppViewData, ControlPanelPage, ModuleDataType, VodQueueGame } from 'shared'
import { PanelField } from '../controls/PanelField'
import { channelAction } from '../utils'
import { Dropdown } from '../controls/Dropdown'
import { QueuedVod } from '../controls/QueuedVod'
import { Button } from '../controls/Button'

export function VodQueuePanel(props: ControlPanelAppViewData & ModuleDataType<'vodQueue'> & { page: ControlPanelPage }) {
    const [tested, setTested] = React.useState(false)

    const mockVod = async () => {
        try {
            await channelAction('vodqueue/mock', {})
            setTested(true)
        } catch (e) {
            console.error(e)
        }
    }

    const patchDate = new Date(props.state.patchDate)

    switch (props.page) {
        case ControlPanelPage.view:
            return <>
                {props.config.game !== VodQueueGame.generic ? <PanelField label="Latest Patch">
                    <i>{isNaN(patchDate.getTime()) ? 'Unknown' : patchDate.toDateString()}</i>
                </PanelField> : <></>}
                <PanelField>
                    <div id="vods">
                        {props.state.entries.length
                            ? props.state.entries.map(e => <QueuedVod vod={e} patchDate={patchDate.getTime()} config={props.config} />)
                            : <i>No VOD entries submitted</i>}
                    </div>
                </PanelField>
            </>
        case ControlPanelPage.edit:
            return <>
                <hr />
                <PanelField label="Reward Name" help="This should be exactly the same as the name displayed for the channel point reward in Twitch">
                    <input type="text" defaultValue={props.config.redeemName} onChange={e => channelAction('vodqueue/set-config', { redeemName: e.target.value })} />
                </PanelField>
                <PanelField label="Game" help="The game this queue is configured for; provides additional functionality">
                    <Dropdown options={Object.values(VodQueueGame).map(e => ({ value: e }))} selected={props.config.game} onSelect={v => channelAction('vodqueue/set-config', { game: v as VodQueueGame })} />
                </PanelField>
                <PanelField>
                    <Button onClick={() => mockVod()}>Test mode</Button>
                    {tested ? <>&nbsp;<span>Success! Check the main tab!</span></> : <></>}
                </PanelField>
            </>
        default:
            return <></>
    }
}
