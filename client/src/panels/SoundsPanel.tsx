import * as React from 'react'
import { ControlPanelAppViewData, ControlPanelPage, ModuleDataType, PanelViewDataProps } from 'shared'
import { PanelField } from '../controls/PanelField'
import { Button } from '../controls/Button'
import { channelAction, classes } from '../utils'
import { ExternalIconPicker } from '../controls/ExternalIconPicker'
import { Toggle } from '../controls/Toggle'
import { TwitchRewardDropdown } from '../controls/TwitchRewardDropdown'
import { QueuedSound } from '../controls/QueuedSound'
import { Dropdown } from '../controls/Dropdown'
import { Expander } from '../controls/Expander'
import { Fold } from '../controls/Fold'

async function uploadFile(file: File | undefined) {
    if (file) {
        const buffer = await file.arrayBuffer()
        const base64 = btoa([...new Uint8Array(buffer)].map(b => String.fromCharCode(b)).join(''))
        await channelAction('sounds/upload', { fileName: file.name, data: base64 })
    }
}

export function SoundsPanel(props: ControlPanelAppViewData & ModuleDataType<'sounds'> & PanelViewDataProps) {
    const [tested, setTested] = React.useState('')

    const mockEvent = async (configID: string) => {
        try {
            await channelAction('sounds/mock', { configID, username: 'Anonymous' })
            setTested(configID)
        } catch (e) {
            console.error(e)
        }
    }

    switch (props.page) {
        case ControlPanelPage.view:
            return <>
                <PanelField>
                    <div id="sounds">
                        {props.state.sounds.length ? props.state.sounds.map(s => <QueuedSound key={s.id} sound={s} config={props.config.sounds.find(c => c.id === s.configID)!} />) : <i>No sounds currently queued</i>}
                    </div>
                </PanelField>
            </>
        case ControlPanelPage.edit:
            return <>
                <hr />
                <PanelField>
                    Sounds are played through the overlay browser source. Ensure that "Control audio via OBS" is checked in the browser source in settings, and that the source is set to "Monitor and Output" in the audio mixer.
                </PanelField>
                <PanelField>
                    <div id="sounds">
                        {props.config.sounds.map(c => <div key={c.id} className={classes('QueuedEvent')}>
                            <PanelField label="Reward" help="This is the channel point reward in Twitch that will trigger this sound">
                                <TwitchRewardDropdown nullable selectedID={c.redeemID} selectedName={c.redeemName} onSelect={(id, name) => channelAction('sounds/edit-config', { id: c.id, redeemID: id, redeemName: name })} />
                            </PanelField>
                            {(props.panel.items?.[c.id] ?? true) ? <>
                                <PanelField label="Emote" help="This emote is shown in the overlay when the sound is redeemed">
                                    <ExternalIconPicker selected={c.emote} onSelect={v => channelAction('sounds/edit-config', { id: c.id, emote: v })} />
                                </PanelField>
                                <PanelField label="Show Username" help="Whether the username of the person who redeemed the sound should be displayed in the overlay before the rest of the text">
                                    <Toggle value={c.showUsername} onToggle={v => channelAction('sounds/edit-config', { id: c.id, showUsername: v })} />
                                </PanelField>
                                <PanelField label="Display Name" help="The name to display for this sound in the overlay when redeemed">
                                    <input type="text" defaultValue={c.displayName} onChange={e => channelAction('sounds/edit-config', { id: c.id, displayName: e.target.value })} />
                                </PanelField>
                                <PanelField label="Volume" help="The volume that the sound will play at">
                                    <input type="range" min="0" max="1" step="any" defaultValue={c.volume} onChange={e => channelAction('sounds/edit-config', { id: c.id, volume: e.target.valueAsNumber })} />
                                &nbsp;{Math.round(c.volume * 100)}%
                            </PanelField>
                                <PanelField label="Select File" help="Select a sound file to use for this sound redeem">
                                    <Dropdown nullable selected={c.fileName} options={props.config.uploads.map(u => ({ value: u }))} onSelect={u => channelAction('sounds/edit-config', { id: c.id, fileName: u })} />
                                </PanelField>
                                <PanelField label="File Upload" help="Upload a sound file for use with sound redeems">
                                    <input type="file" key={props.config.uploads.length} onChange={e => uploadFile(e.target.files?.[0])} />
                                </PanelField>
                                <PanelField>
                                    <Button onClick={() => mockEvent(c.id)}>Test sound</Button>
                                    {c.id === tested ? <>&nbsp;<span>Success! Check the main tab!</span></> : <></>}
                                </PanelField>
                                <PanelField>
                                    <Button onClick={() => channelAction('sounds/delete-config', { id: c.id })}>Delete sound</Button>
                                </PanelField>
                            </> : <Fold />}
                            <Expander open={props.panel.items?.[c.id] ?? true} onToggle={open => props.onToggleItem(c.id, open)} />
                        </div>)}
                    </div>
                </PanelField>
                <PanelField>
                    <Button primary onClick={() => channelAction('sounds/add-config', {})}>Add new sound</Button>
                </PanelField>
            </>
        default:
            return <></>
    }
}
