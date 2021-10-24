import * as React from 'react'
import { ControlPanelAppViewData, ControlPanelPage, ModuleDataType, PanelViewDataProps, safeParseFloat, SoundConfig } from 'shared'
import { PanelField } from '../controls/PanelField'
import { Button } from '../controls/Button'
import { channelAction } from '../utils'
import { ExternalIconPicker } from '../controls/ExternalIconPicker'
import { Toggle } from '../controls/Toggle'
import { QueuedSound } from '../controls/QueuedSound'
import { UploadPicker } from '../controls/UploadPicker'
import { Dropdown, DropdownOption } from '../controls/Dropdown'
import { ConfigList } from 'src/controls/ConfigList'

export function SoundsPanel(props: ControlPanelAppViewData & ModuleDataType<'sounds'> & PanelViewDataProps) {

    const soundTypeLabels: Record<SoundConfig['type'], string> = {
        one: 'Single sound',
        any: 'Random Sound',
        "weighted-any": 'Random Sound (Weighted)',
    }

    const soundTypeOptions: DropdownOption[] = Object.entries(soundTypeLabels).map(([value, text]) => ({ value, text }))

    switch (props.page) {
        case ControlPanelPage.view:
            return <>
                <PanelField>
                    <div className="QueuedItemList">
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
                <ConfigList configs={props.config.sounds} label="Sounds" configType="sound" panelData={props} addAction="sounds/add-config" editAction="sounds/edit-config" deleteAction="sounds/delete-config" mockAction="sounds/mock">
                    {c => <>
                        <PanelField label="Emote" help="This emote is shown in the overlay when the sound is redeemed.">
                            <ExternalIconPicker selected={c.emote} onSelect={v => channelAction('sounds/edit-config', { id: c.id, emote: v })} />
                        </PanelField>
                        <PanelField label="Show Username" help="Whether the username of the person who redeemed the sound should be displayed in the overlay before the rest of the text.">
                            <Toggle value={c.showUsername} onToggle={v => channelAction('sounds/edit-config', { id: c.id, showUsername: v })} />
                        </PanelField>
                        <PanelField label="Display Name" help="The name to display for this sound in the overlay when redeemed.">
                            <input type="text" defaultValue={c.displayName} onChange={e => channelAction('sounds/edit-config', { id: c.id, displayName: e.target.value })} />
                        </PanelField>
                        <PanelField label="Volume" help="The volume that the sound will play at.">
                            <input type="range" min="0" max="1" step="any" defaultValue={c.volume} onChange={e => channelAction('sounds/edit-config', { id: c.id, volume: safeParseFloat(e.target.value) ?? c.volume })} />
                                &nbsp;{Math.round(c.volume * 100)}%
                                </PanelField>
                        <PanelField label="Type" help="How the sound being played will be determined.">
                            <Dropdown selected={c.type} options={soundTypeOptions} onSelect={v => channelAction('sounds/edit-config', { id: c.id, type: v })} />
                        </PanelField>
                        {(c.type ?? 'one') === 'one' ? <PanelField label="Select File" help="Select a sound file to play for this sound redeem.">
                            <UploadPicker icon="volume" files={props.config.uploads} selected={c.fileName} onSelect={u => channelAction('sounds/edit-config', { id: c.id, fileName: u })} onDelete={fileName => channelAction('sounds/delete-upload', { fileName })} onUpload={(fileName, data) => channelAction('sounds/add-upload', { fileName, data })} />
                        </PanelField> : <PanelField>
                            <div className="QueuedItemList">
                                {c.sounds?.map((s, i) => <div key={s.fileName} className="QueuedItem">
                                    <PanelField label="Select File" help="The sound file to play, and its chance of being picked relative to other sounds (higher means more likely).">
                                        <UploadPicker icon="volume" files={props.config.uploads} selected={s.fileName} onSelect={u => channelAction('sounds/edit-config', { id: c.id, sounds: u ? [...(c.sounds?.slice(0, i) ?? []), { ...s, fileName: u }, ...(c.sounds?.slice(i + 1) ?? [])] : [...(c.sounds?.slice(0, i) ?? []), ...(c.sounds?.slice(i + 1) ?? [])] })} onDelete={fileName => channelAction('sounds/delete-upload', { fileName })} onUpload={(fileName, data) => channelAction('sounds/add-upload', { fileName, data })} />
                                        {c.type === 'weighted-any' ? <>
                                            &nbsp;
                                                    <input type="number" step="any" defaultValue={s.weight ?? 1} onChange={e => channelAction('sounds/edit-config', { id: c.id, sounds: [...(c.sounds?.slice(0, i) ?? []), { ...s, weight: safeParseFloat(e.target.value) ?? s.weight }, ...(c.sounds?.slice(i + 1) ?? [])] })} />
                                        </> : null}
                                    </PanelField>
                                </div>)}
                                <Button onClick={() => channelAction('sounds/edit-config', { id: c.id, sounds: [...(c.sounds ?? []), { fileName: null }] })}>Add sound option</Button>
                            </div>
                        </PanelField>}
                        <PanelField label="Use Queue" help="Whether the system should wait until other queued sounds are done playing before playing this one.">
                            <Toggle value={c.blocking ?? false} onToggle={v => channelAction('sounds/edit-config', { id: c.id, blocking: v })} />
                        </PanelField>
                    </>}
                </ConfigList>
            </>
        default:
            return <></>
    }
}
