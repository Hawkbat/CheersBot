import * as React from 'react'
import { ColorTintConfig, ControlPanelAppViewData, ControlPanelPage, logError, ModelSwapConfig, ModuleDataType, PanelViewDataProps, safeParseFloat, safeParseInt, TriggerHotkeyConfig } from 'shared'
import { PanelField } from '../controls/PanelField'
import { channelAction, useRepeatingEffect } from '../utils'
import { Dropdown, DropdownOption } from '../controls/Dropdown'
import { Button } from '../controls/Button'
import { useVTubeStudioConnection, useVTubeStudioProcessing } from '../vtstudio'
import { ExternalIconPicker } from '../controls/ExternalIconPicker'
import { TagList } from '../controls/TagList'
import { Toggle } from '../controls/Toggle'
import { QueuedSwap } from '../controls/QueuedSwap'
import { QueuedTrigger } from '../controls/QueuedTrigger'
import { QueuedTint } from '../controls/QueuedTint'
import { ColorPicker } from '../controls/ColorPicker'
import { VTubeStudioIndicator } from '../controls/VTubeStudioIndicator'
import { ConfigList } from 'src/controls/ConfigList'

export function VTubeStudioPanel(props: ControlPanelAppViewData & ModuleDataType<'vtubeStudio'> & PanelViewDataProps) {
    const [models, setModels] = React.useState<{ id: string, name: string }[]>([])
    const [hotkeys, setHotkeys] = React.useState<{ id: string, name: string }[]>([])
    const [artMeshNames, setArtMeshNames] = React.useState<string[]>([])
    const [artMeshTags, setArtMeshTags] = React.useState<string[]>([])

    const vts = useVTubeStudioConnection({ ...props, type: 'control-panel' })
    useVTubeStudioProcessing({ ...props, enabled: !props.config.useOverlay, ...vts })
    const status = props.state.status

    const refreshDropdowns = React.useCallback(async () => {
        if (vts.client && vts.connected) {
            await vts.execute(async () => {
                const models = await vts.client.plugin.models()
                setModels(models.map(m => ({ id: m.id, name: m.name })))
                const currentModel = await vts.client.plugin.currentModel()
                if (currentModel) {
                    const hotkeys = await currentModel.hotkeys()
                    setHotkeys(hotkeys.map(h => ({ id: h.id, name: h.name })))
                    const artMeshNames = await currentModel.artMeshNames()
                    setArtMeshNames(artMeshNames)
                    const artMeshTags = await currentModel.artMeshTags()
                    setArtMeshTags(artMeshTags)
                } else {
                    setHotkeys([])
                    setArtMeshNames([])
                    setArtMeshTags([])
                }
            })
        }
    }, [vts.client, vts.connected])
    useRepeatingEffect(refreshDropdowns, 10 * 1000, true)

    const getModelPosition = async () => {
        const m = await vts.client.plugin.currentModel()
        return await m?.position() ?? null
    }

    const modelOptions: DropdownOption[] = [
        ...models.map(m => ({ value: m.id, text: m.name ? m.name : '(Unnamed)' })),
        ...props.config.swaps
            .flatMap(c => c.models)
            .filter(m => !models.some(o => o.id === m.id || o.name === m.name))
            .map(m => ({ value: m.id, text: m.name, invalid: true })),
    ].sort((a, b) => a.text.localeCompare(b.text))

    const hotkeyOptions: DropdownOption[] = [
        ...hotkeys.map(h => ({ value: h.id, text: h.name ? h.name : '(Unnamed)' })),
        ...props.config.triggers
            .flatMap(c => c.hotkeys)
            .filter(h => !hotkeys.some(o => o.id === h.id || o.name === h.name))
            .map(h => ({ value: h.id, text: h.name, invalid: true })),
    ].sort((a, b) => a.text.localeCompare(b.text))

    const artMeshNameOptions: DropdownOption[] = [
        ...artMeshNames.map(n => ({ value: n })),
        ...props.config.tints
            .flatMap(c => c.matches)
            .flatMap(m => m.names)
            .filter(n => !artMeshNames.includes(n))
            .map(n => ({ value: n, invalid: true })),
    ].sort((a, b) => a.value.localeCompare(b.value))

    const artMeshTagOptions: DropdownOption[] = [
        ...artMeshTags.map(t => ({ value: t })),
        ...props.config.tints
            .flatMap(c => c.matches)
            .flatMap(m => m.tags)
            .filter(t => !artMeshTags.includes(t))
            .map(t => ({ value: t, invalid: true })),
    ].sort((a, b) => a.value.localeCompare(b.value))

    const modelTypeLabels: Record<ModelSwapConfig['type'], string> = {
        one: 'Single Model',
        any: 'Random Model',
        "weighted-any": 'Random Model (Weighted)',
    }

    const modelTypeOptions: DropdownOption[] = Object.entries(modelTypeLabels).map(([value, text]) => ({ value, text }))

    const modelAfterLabels: Record<Exclude<ModelSwapConfig['after'], undefined>, string> = {
        nothing: 'Keep New Model',
        config: 'Another Model Swap',
        revert: 'Revert to Previous Model',
    }

    const modelAfterOptions: DropdownOption[] = Object.entries(modelAfterLabels).map(([value, text]) => ({ value, text }))

    const hotkeyTypeLabels: Record<TriggerHotkeyConfig['type'], string> = {
        one: 'Single Hotkey',
        any: 'Random Hotkey',
        "weighted-any": 'Random Hotkey (Weighted)',
        all: 'Multiple Hotkeys',
    }

    const hotkeyTypeOptions: DropdownOption[] = Object.entries(hotkeyTypeLabels).map(([value, text]) => ({ value, text }))

    const hotkeyAfterLabels: Record<Exclude<TriggerHotkeyConfig['after'], undefined>, string> = {
        nothing: 'Do Nothing',
        config: 'Another Hotkey Trigger',
        retrigger: 'Retrigger Hotkeys',
    }

    const hotkeyAfterOptions: DropdownOption[] = Object.entries(hotkeyAfterLabels).map(([value, text]) => ({ value, text }))

    const tintTypeLabels: Record<ColorTintConfig['type'], string> = {
        all: 'Whole Model',
        match: 'Specific ArtMeshes',
        rainbow: 'Rainbow Mode!',
    }

    const tintTypeOptions: DropdownOption[] = Object.entries(tintTypeLabels).map(([value, text]) => ({ value, text }))

    const tintAfterLabels: Record<Exclude<ColorTintConfig['after'], undefined>, string> = {
        nothing: 'Keep New Colors',
        config: 'Another Color Tint',
        reset: 'Reset Colors',
    }

    const tintAfterOptions: DropdownOption[] = Object.entries(tintAfterLabels).map(([value, text]) => ({ value, text }))

    switch (props.page) {
        case ControlPanelPage.view:
            return <>
                {props.config.useOverlay ?
                    <VTubeStudioIndicator type="overlay" processing connected={Date.now() < status.time + 30000 ? status.connected : false} apiError={String(status.apiError ?? '')} readyState={status.readyState} /> :
                    <VTubeStudioIndicator type="control-panel" processing connected={vts.connected} apiError={String(vts.apiError ?? '')} readyState={vts.client.ws.readyState} />
                }
                <PanelField>
                    <div className="QueuedItemList">
                        {props.state.swaps.length
                            ? props.state.swaps.map(s => <QueuedSwap key={s.id} swap={s} config={props.config.swaps.find(c => c.id === s.configID)} />)
                            : <i>No model swaps in queue</i>
                        }
                    </div>
                </PanelField>
                <PanelField>
                    <div className="QueuedItemList">
                        {props.state.triggers.length
                            ? props.state.triggers.map(t => <QueuedTrigger key={t.id} trigger={t} config={props.config.triggers.find(c => c.id === t.configID)} />)
                            : <i>No hotkey triggers in queue</i>
                        }
                    </div>
                </PanelField>
                <PanelField>
                    <div className="QueuedItemList">
                        {props.state.tints.length
                            ? props.state.tints.map(t => <QueuedTint key={t.id} tint={t} config={props.config.tints.find(c => c.id === t.configID)} />)
                            : <i>No color tints in queue</i>
                        }
                    </div>
                </PanelField>
            </>
        case ControlPanelPage.edit:
            return <>
                <hr />
                <VTubeStudioIndicator type="control-panel" processing={!props.config.useOverlay} connected={vts.connected} apiError={String(vts.apiError ?? '')} readyState={vts.client.ws.readyState} />
                <hr />
                <PanelField>
                    <span>Don't want to color artmeshes individually? Try tagging them with my <a href="http://hawk.bar/VTubeStudioTagger/">userdata tagging</a> tool. I also have a handy <a href="http://hawk.bar/VTubeStudioParameterView/">Live2D parameter viewer</a> for seeing all of your model's parameters in real-time.</span>
                </PanelField>
                <hr />
                <ConfigList configs={props.config.swaps} label="Model Swaps" configType="model swap" panelData={props} addAction="vtstudio/add-model-swap" editAction="vtstudio/edit-model-swap" deleteAction="vtstudio/delete-model-swap" mockAction="vtstudio/mock-model-swap">
                    {c => <>
                        <PanelField label="Emote" help="This emote is shown in the overlay when the model swap is redeemed.">
                            <ExternalIconPicker selected={c.emote} onSelect={v => channelAction('vtstudio/edit-model-swap', { id: c.id, emote: v })} />
                        </PanelField>
                        <PanelField label="Show Username" help="Whether the username of the person who redeemed the model swap should be displayed in the overlay before the rest of the text.">
                            <Toggle value={c.showUsername} onToggle={v => channelAction('vtstudio/edit-model-swap', { id: c.id, showUsername: v })} />
                        </PanelField>
                        <PanelField label="Message" help="The text displayed when the model swap is redeemed.">
                            <input type="text" defaultValue={c.message} onChange={e => channelAction('vtstudio/edit-model-swap', { id: c.id, message: e.target.value })} />
                        </PanelField>
                        <PanelField label="Duration" help="The number of seconds that the message will remain on screen for after the model loads; also affects delay until next model change can occur.">
                            <input type="number" step="any" defaultValue={c.duration} onChange={e => channelAction('vtstudio/edit-model-swap', { id: c.id, duration: safeParseFloat(e.target.value) ?? c.duration })} />&nbsp;seconds
                        </PanelField>
                        <PanelField label="Type" help="How the model being swapped in will be determined.">
                            <Dropdown selected={c.type} options={modelTypeOptions} onSelect={v => channelAction('vtstudio/edit-model-swap', { id: c.id, type: v })} />
                        </PanelField>
                        {c.type === 'one' ? <>
                            <PanelField label="Model" help="The model that will be swapped in.">
                                <Dropdown selected={c.models[0]?.id ?? ''} options={modelOptions} onSelect={v => channelAction('vtstudio/edit-model-swap', { id: c.id, models: v ? [{ id: v, name: models.find(m => m.id === v)?.name ?? '' }] : [] })} nullable />
                            </PanelField>
                            {c.models[0] ? <PanelField label="Position" help="The position on screen to place the model at, if set.">
                                <Button primary onClick={async () => channelAction('vtstudio/edit-model-swap', { id: c.id, models: [{ ...c.models[0], position: await getModelPosition() ?? c.models[0].position }] })}>Save Current</Button>
                                &nbsp;
                                {!!c.models[0]?.position ? <Button onClick={() => channelAction('vtstudio/edit-model-swap', { id: c.id, models: [{ ...c.models[0], position: null }] })}>Clear</Button> : null}
                            </PanelField> : null}
                        </> : c.type === 'weighted-any' ? <PanelField>
                            <div className="QueuedItemList">
                                {c.models.map((m, i) => <div key={m.id} className="QueuedItem">
                                    <PanelField label="Model" help="The model that will be swapped in, and its chance of being picked relative to other models (higher means more likely).">
                                        <Dropdown selected={m.id} nullable nullText="(Remove)" options={modelOptions} onSelect={v => channelAction('vtstudio/edit-model-swap', { id: c.id, models: v ? [...c.models.slice(0, i), { id: v, name: models.find(m => m.id === v)?.name ?? '', weight: m.weight }, ...c.models.slice(i + 1)] : [...c.models.slice(0, i), ...c.models.slice(i + 1)] })} />
                                        &nbsp;
                                        <input type="number" step="any" defaultValue={m.weight ?? 1} onChange={e => channelAction('vtstudio/edit-model-swap', { id: c.id, models: [...c.models.slice(0, i), { ...m, weight: safeParseFloat(e.target.value) ?? m.weight }, ...c.models.slice(i + 1)] })} />
                                        &nbsp;chances
                                    </PanelField>
                                    {c.models[i] ? <PanelField label="Position" help="The position on screen to place the model at, if set.">
                                        <Button primary onClick={async () => channelAction('vtstudio/edit-model-swap', { id: c.id, models: [...c.models.slice(0, i), { ...c.models[i], position: await getModelPosition() ?? c.models[i].position }, ...c.models.slice(i + 1)] })}>Save Current</Button>
                                        &nbsp;
                                        {!!c.models[i]?.position ? <Button onClick={() => channelAction('vtstudio/edit-model-swap', { id: c.id, models: [...c.models.slice(0, i), { ...c.models[i], position: null }, ...c.models.slice(i + 1)] })}>Clear</Button> : null}
                                    </PanelField> : null}
                                </div>)}
                                Add Model:&nbsp;<Dropdown selected='' nullable options={modelOptions.filter(o => !c.models.some(e => e.id === o.value))} onSelect={v => channelAction('vtstudio/edit-model-swap', { id: c.id, models: [...c.models, { id: v, name: models.find(m => m.id === v)?.name ?? '', weight: 1 }] })} />
                            </div>
                        </PanelField> : <PanelField label="Models" help="The list of models that the swapped in model will be selected from.">
                            <TagList selected={c.models.map(m => m.id)} options={modelOptions} onSelect={v => channelAction('vtstudio/edit-model-swap', { id: c.id, models: [...c.models, { id: v, name: models.find(m => m.id === v)?.name ?? '' }] })} onDeselect={v => channelAction('vtstudio/edit-model-swap', { id: c.id, models: c.models.filter(m => m.id !== v) })} />
                        </PanelField>}
                        <PanelField label="After" help="The action to take after the model swap has completed.">
                            <Dropdown selected={c.after ?? 'nothing'} options={modelAfterOptions} onSelect={v => channelAction('vtstudio/edit-model-swap', { id: c.id, after: v })} />
                        </PanelField>
                        {c.after === 'revert' ? <PanelField label="Revert Delay" help="How long to wait before reverting to the previous model. If blank, defaults to the Duration.">
                            <input type="number" step="any" defaultValue={c.revertDelay ?? undefined} onChange={e => channelAction('vtstudio/edit-model-swap', { id: c.id, revertDelay: safeParseFloat(e.target.value) })} />&nbsp;seconds
                        </PanelField> : null}
                        {c.after === 'config' ? <PanelField label="Other Swap" help="The other model swap to activate afterwards. Must be set up as a model swap, although it may have a blank trigger." >
                            <Dropdown nullable selected={c.afterConfig ?? ''} options={props.config.swaps.map(o => ({ value: o.id, text: o.redeemName ? o.redeemName : o.message ? o.message : o.models.length ? o.models.map(m => m.name).join(', ') : '(Blank)' }))} onSelect={v => channelAction('vtstudio/edit-model-swap', { id: c.id, afterConfig: v })} />
                        </PanelField> : null}
                        {c.after === 'config' ? <PanelField label="Swap Delay" help="How long to wait before activating the other model swap. If blank, defaults to the Duration.">
                            <input type="number" step="any" defaultValue={c.revertDelay ?? undefined} onChange={e => channelAction('vtstudio/edit-model-swap', { id: c.id, revertDelay: safeParseFloat(e.target.value) })} />&nbsp;seconds
                        </PanelField> : null}
                    </>}
                </ConfigList>
                {modelOptions.some(o => o.invalid) ? <PanelField>
                    <i>* Model is not currently loaded or VTube Studio is not connected</i>
                </PanelField> : null}
                <ConfigList configs={props.config.triggers} label="Hotkey Triggers" configType="hotkey trigger" panelData={props} addAction="vtstudio/add-hotkey-trigger" editAction="vtstudio/edit-hotkey-trigger" deleteAction="vtstudio/delete-hotkey-trigger" mockAction="vtstudio/mock-hotkey-trigger">
                    {c => <>
                        <PanelField label="Emote" help="This emote is shown in the overlay when the hotkey trigger is redeemed.">
                            <ExternalIconPicker selected={c.emote} onSelect={v => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, emote: v })} />
                        </PanelField>
                        <PanelField label="Show Username" help="Whether the username of the person who redeemed the hotkey trigger should be displayed in the overlay before the rest of the text.">
                            <Toggle value={c.showUsername} onToggle={v => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, showUsername: v })} />
                        </PanelField>
                        <PanelField label="Message" help="The text displayed when the hotkey trigger is redeemed.">
                            <input type="text" defaultValue={c.message} onChange={e => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, message: e.target.value })} />
                        </PanelField>
                        <PanelField label="Duration" help="The number of seconds that the message will remain on screen for after the hotkey triggers; also affects delay until next hotkey trigger can occur.">
                            <input type="number" step="any" defaultValue={c.duration} onChange={e => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, duration: safeParseFloat(e.target.value) ?? c.duration })} />&nbsp;seconds
                        </PanelField>
                        <PanelField label="Type" help="How the hotkey being triggered will be determined.">
                            <Dropdown selected={c.type} options={hotkeyTypeOptions} onSelect={v => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, type: v })} />
                        </PanelField>
                        {c.type === 'one' ? <PanelField label="Hotkey" help="The hotkey that will be triggered.">
                            <Dropdown selected={c.hotkeys[0]?.id ?? ''} options={hotkeyOptions} onSelect={v => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, hotkeys: v ? [{ id: v, name: hotkeys.find(h => h.id === v)?.name ?? '' }] : [] })} nullable />
                        </PanelField> : c.type === 'weighted-any' ? <PanelField>
                            <div className="QueuedItemList">
                                {c.hotkeys.map((h, i) => <div key={h.id} className="QueuedItem">
                                    <PanelField label="Hotkey" help="The hotkey that will be triggered, and its chance of being picked relative to other hotkeys (higher means more likely).">
                                        <Dropdown selected={h.id} nullable nullText="(Remove)" options={hotkeyOptions} onSelect={v => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, hotkeys: v ? [...c.hotkeys.slice(0, i), { id: v, name: hotkeys.find(h => h.id === v)?.name ?? '', weight: h.weight }, ...c.hotkeys.slice(i + 1)] : [...c.hotkeys.slice(0, i), ...c.hotkeys.slice(i + 1)] })} />
                                        &nbsp;
                                        <input type="number" step="any" defaultValue={h.weight ?? 1} onChange={e => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, hotkeys: [...c.hotkeys.slice(0, i), { ...h, weight: safeParseFloat(e.target.value) ?? h.weight }, ...c.hotkeys.slice(i + 1)] })} />
                                        &nbsp;chances
                                    </PanelField>
                                </div>)}
                                Add Hotkey:&nbsp;<Dropdown selected='' nullable options={hotkeyOptions.filter(o => !c.hotkeys.some(e => e.id === o.value))} onSelect={v => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, hotkeys: [...c.hotkeys, { id: v, name: hotkeys.find(h => h.id === v)?.name ?? '', weight: 1 }] })} />
                            </div>
                        </PanelField> : <PanelField label="Hotkeys" help="The list of hotkeys that the triggered hotkey will be selected from.">
                            <TagList selected={c.hotkeys.map(h => h.id)} options={hotkeyOptions} onSelect={v => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, hotkeys: [...c.hotkeys, { id: v, name: hotkeys.find(h => h.id === v)?.name ?? '' }] })} onDeselect={v => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, hotkeys: c.hotkeys.filter(h => h.id !== v) })} />
                        </PanelField>}
                        <PanelField label="After" help="The action to take after the hotkey trigger has completed.">
                            <Dropdown selected={c.after ?? 'nothing'} options={hotkeyAfterOptions} onSelect={v => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, after: v })} />
                        </PanelField>
                        {c.after === 'retrigger' ? <PanelField label="Retrigger Delay" help="How long to wait before triggering the hotkey again. If blank, defaults to the Duration.">
                            <input type="number" step="any" defaultValue={c.retriggerDelay ?? undefined} onChange={e => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, retriggerDelay: safeParseFloat(e.target.value) })} />&nbsp;seconds
                        </PanelField> : null}
                        {c.after === 'config' ? <PanelField label="Other Hotkey" help="The other hotkey trigger to activate afterwards. Must be set up as a hotkey trigger, although it may have a blank trigger." >
                            <Dropdown nullable selected={c.afterConfig ?? ''} options={props.config.triggers.map(o => ({ value: o.id, text: o.redeemName ? o.redeemName : o.message ? o.message : o.hotkeys.length ? o.hotkeys.map(h => h.name).join(', ') : '(Blank)' }))} onSelect={v => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, afterConfig: v })} />
                        </PanelField> : null}
                        {c.after === 'config' ? <PanelField label="Trigger Delay" help="How long to wait before activating the other hotkey trigger. If blank, defaults to the Duration.">
                            <input type="number" step="any" defaultValue={c.retriggerDelay ?? undefined} onChange={e => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, retriggerDelay: safeParseFloat(e.target.value) })} />&nbsp;seconds
                        </PanelField> : null}
                    </>}
                </ConfigList>
                {hotkeyOptions.some(o => o.invalid) ? <PanelField>
                    <i>* Hotkey does not exist on the currently loaded model or VTube Studio is not connected</i>
                </PanelField> : null}
                <ConfigList configs={props.config.tints} label="Color Tints" configType="color tint" panelData={props} addAction="vtstudio/add-color-tint" editAction="vtstudio/edit-color-tint" deleteAction="vtstudio/delete-color-tint" mockAction="vtstudio/mock-color-tint">
                    {c => <>
                        <PanelField label="Emote" help="This emote is shown in the overlay when the color tint is redeemed.">
                            <ExternalIconPicker selected={c.emote} onSelect={v => channelAction('vtstudio/edit-color-tint', { id: c.id, emote: v })} />
                        </PanelField>
                        <PanelField label="Show Username" help="Whether the username of the person who redeemed the color tint should be displayed in the overlay before the rest of the text.">
                            <Toggle value={c.showUsername} onToggle={v => channelAction('vtstudio/edit-color-tint', { id: c.id, showUsername: v })} />
                        </PanelField>
                        <PanelField label="Message" help="The text displayed when the color tint is redeemed.">
                            <input type="text" defaultValue={c.message} onChange={e => channelAction('vtstudio/edit-color-tint', { id: c.id, message: e.target.value })} />
                        </PanelField>
                        <PanelField label="Duration" help="The number of seconds that the message will remain on screen for after the color tints; also affects delay until next color tint can occur.">
                            <input type="number" step="any" defaultValue={c.duration} onChange={e => channelAction('vtstudio/edit-color-tint', { id: c.id, duration: safeParseFloat(e.target.value) ?? c.duration })} />&nbsp;seconds
                        </PanelField>
                        <PanelField label="Type" help="How the color tint will be applied.">
                            <Dropdown selected={c.type} options={tintTypeOptions} onSelect={v => channelAction('vtstudio/edit-color-tint', { id: c.id, type: v })} />
                        </PanelField>
                        {c.type === 'all' ? <PanelField label="Color" help="The color to tint the model with">
                            <ColorPicker value={c.color} onChange={v => channelAction('vtstudio/edit-color-tint', { id: c.id, color: v })} />
                        </PanelField> : c.type === 'match' ? <>
                            <PanelField>
                                <div className="QueuedItemList">
                                    {c.matches.map((m, i) => <div key={i} className="QueuedItem">
                                        <PanelField label="Color" help="The color to tint matching ArtMeshes">
                                            <ColorPicker value={m.color} onChange={v => channelAction('vtstudio/edit-color-tint', { id: c.id, matches: [...c.matches.slice(0, i), { ...m, color: v }, ...c.matches.slice(i + 1)] })} />
                                            &nbsp;
                                            <div className="spacer" />
                                            <Button onClick={() => channelAction('vtstudio/edit-color-tint', { id: c.id, matches: [...c.matches.slice(0, i), ...c.matches.slice(i + 1)] })}>X</Button>
                                        </PanelField>
                                        <PanelField label="ArtMesh Names">
                                            <TagList selected={m.names} options={artMeshNameOptions} onSelect={v => channelAction('vtstudio/edit-color-tint', { id: c.id, matches: [...c.matches.slice(0, i), { ...m, names: [...m.names, v] }, ...c.matches.slice(i + 1)] })} onDeselect={v => channelAction('vtstudio/edit-color-tint', { id: c.id, matches: [...c.matches.slice(0, i), { ...m, names: m.names.filter(o => o !== v) }, ...c.matches.slice(i + 1)] })} />
                                        </PanelField>
                                        <PanelField label="ArtMesh Tags">
                                            <TagList selected={m.tags} options={artMeshTagOptions} onSelect={v => channelAction('vtstudio/edit-color-tint', { id: c.id, matches: [...c.matches.slice(0, i), { ...m, tags: [...m.tags, v] }, ...c.matches.slice(i + 1)] })} onDeselect={v => channelAction('vtstudio/edit-color-tint', { id: c.id, matches: [...c.matches.slice(0, i), { ...m, tags: m.tags.filter(o => o !== v) }, ...c.matches.slice(i + 1)] })} />
                                        </PanelField>
                                    </div>)}
                                </div>
                            </PanelField>
                            <PanelField>
                                <Button onClick={() => channelAction('vtstudio/edit-color-tint', { id: c.id, matches: [...c.matches, { color: { r: 255, g: 255, b: 255, a: 255 }, names: [], tags: [], }] })}>Add ArtMesh Match</Button>
                            </PanelField>
                        </> : c.type === 'rainbow' ? <PanelField label="Rainbow Speed" help="How fast to cycle through colors, in full cycles of the rainbow per second">
                            <input type="number" step="any" defaultValue={c.rainbowSpeed} onChange={e => channelAction('vtstudio/edit-color-tint', { id: c.id, rainbowSpeed: safeParseFloat(e.target.value) ?? c.rainbowSpeed })} />&nbsp;cycles per second
                        </PanelField> : null}
                        <PanelField label="After" help="The action to take after the color tint has completed.">
                            <Dropdown selected={c.after ?? 'nothing'} options={tintAfterOptions} onSelect={v => channelAction('vtstudio/edit-color-tint', { id: c.id, after: v })} />
                        </PanelField>
                        {c.after === 'reset' ? <PanelField label="Reset Delay" help="How long to wait before resetting the color tint. If blank, defaults to the Duration.">
                            <input type="number" step="any" defaultValue={c.resetDelay ?? undefined} onChange={e => channelAction('vtstudio/edit-color-tint', { id: c.id, resetDelay: safeParseFloat(e.target.value) })} />&nbsp;seconds
                        </PanelField> : null}
                        {c.after === 'config' ? <PanelField label="Other Tint" help="The other color tint to activate afterwards. Must be set up as a color tint, although it may have a blank trigger." >
                            <Dropdown nullable selected={c.afterConfig ?? ''} options={props.config.tints.map(o => ({ value: o.id, text: o.redeemName ? o.redeemName : o.message ? o.message : '(Blank)' }))} onSelect={v => channelAction('vtstudio/edit-color-tint', { id: c.id, afterConfig: v })} />
                        </PanelField> : null}
                        {c.after === 'config' ? <PanelField label="Tint Delay" help="How long to wait before activating the other color tint. If blank, defaults to the Duration.">
                            <input type="number" step="any" defaultValue={c.resetDelay ?? undefined} onChange={e => channelAction('vtstudio/edit-color-tint', { id: c.id, resetDelay: safeParseFloat(e.target.value) })} />&nbsp;seconds
                        </PanelField> : null}
                    </>}
                </ConfigList>
                {artMeshNameOptions.some(o => o.invalid) || artMeshTagOptions.some(o => o.invalid) ? <PanelField>
                    <i>* Art mesh or tag does not exist on currently loaded model or VTube Studio is not connected</i>
                </PanelField> : null}
                <hr />
                <PanelField label="Use Overlay" help="Whether to use the browser source overlay to process VTube Studio redeems. Otherwise, the control panel will be used.">
                    <Toggle value={props.config.useOverlay} onToggle={v => channelAction('vtstudio/edit-config', { useOverlay: v })} />
                </PanelField>
                {props.config.useOverlay ? <PanelField label="Debug Overlay" help="Whether to show an indicator of the VTube Studio connection status in the overlay. Useful for checking connection issues.">
                    <Toggle value={props.config.debugOverlay} onToggle={v => channelAction('vtstudio/edit-config', { debugOverlay: v })} />
                </PanelField> : null}
                <hr />
                <PanelField label="API Host" help="The URL to connect to VTube Studio at. When using Cheers Bot on the same device as VTube Studio you will want to leave this as 'localhost'.">
                    <input type="text" value={props.config.apiHost} onChange={e => channelAction('vtstudio/edit-config', { apiHost: e.target.value || props.config.apiHost })} />
                </PanelField>
                <PanelField label="API Port" help="The port to connect to VTube Studio at. This should match the value configured in VTube Studio.">
                    <input type="number" step="any" value={props.config.apiPort} onChange={e => channelAction('vtstudio/edit-config', { apiPort: safeParseInt(e.target.value) ?? props.config.apiPort })} />
                </PanelField>
                <PanelField label="API Secured" help="Whether to use secure websocket protocol when connecting to VTube Studio. When using Cheers Bot on the same device as VTube Studio you will want to leave this off.">
                    <Toggle value={props.config.apiSecure} onToggle={v => channelAction('vtstudio/edit-config', { apiSecure: v })} />
                </PanelField>
            </>
        default:
            return <></>
    }
}
