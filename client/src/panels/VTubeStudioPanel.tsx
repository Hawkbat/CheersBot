import * as React from 'react'
import { ControlPanelAppViewData, ControlPanelPage, ModelSwapConfig, ModuleDataType, PanelViewDataProps, randomItem, randomWeightedItem, TriggerHotkeyConfig } from 'shared'
import { PanelField } from '../controls/PanelField'
import { channelAction, classes, useInterval, wait } from '../utils'
import { Dropdown, DropdownOption } from '../controls/Dropdown'
import { Button } from '../controls/Button'
import { TwitchRewardDropdown } from '../controls/TwitchRewardDropdown'
import { VTSClient } from '../vtstudio'
import { Expander } from '../controls/Expander'
import { ExternalIconPicker } from '../controls/ExternalIconPicker'
import { Fold } from '../controls/Fold'
import { TagList } from '../controls/TagList'
import { Alert } from '../controls/Alert'
import { Toggle } from '../controls/Toggle'
import { QueuedSwap } from '../controls/QueuedTrigger'
import { QueuedTrigger } from '../controls/QueuedSwap'

const VTS_MODEL_SWAP_COOLDOWN = 2500

export function VTubeStudioPanel(props: ControlPanelAppViewData & ModuleDataType<'vtubeStudio'> & PanelViewDataProps) {
    const [tested, setTested] = React.useState('')
    const [connected, setConnected] = React.useState(false)
    const [models, setModels] = React.useState<{ id: string, name: string }[]>([])
    const [hotkeys, setHotkeys] = React.useState<{ id: string, name: string }[]>([])
    const [apiError, setApiError] = React.useState<Error | null>(null)
    const [redeemedSwaps, setRedeemedSwaps] = React.useState<Record<string, boolean>>({})
    const [redeemedTriggers, setRedeemedTriggers] = React.useState<Record<string, boolean>>({})
    const [pollSwapDebounce, setPollSwapDebounce] = React.useState<boolean>(false)
    const [pollTriggerDebounce, setPollTriggerDebounce] = React.useState<boolean>(false)

    const mockEvent = async (configID: string, type: 'model-swap' | 'hotkey-trigger') => {
        try {
            if (type === 'model-swap')
                await channelAction('vtstudio/mock-model-swap', { configID })
            else if (type === 'hotkey-trigger')
                await channelAction('vtstudio/mock-hotkey-trigger', { configID })
            setTested(configID)
        } catch (e) {
            console.error(e)
        }
    }

    const client = React.useMemo(() => {
        const client = new VTSClient(`ws://${props.config.apiHost}:${props.config.apiPort}`)
        client.ws.addEventListener('open', () => setConnected(true))
        client.ws.addEventListener('close', () => setConnected(false))
        return client
    }, [])

    React.useEffect(() => {
        client.ws.url = `ws://${props.config.apiHost}:${props.config.apiPort}`
    }, [client, props.config.apiHost, props.config.apiPort])

    const refreshDropdowns = React.useCallback(async () => {
        if (client && connected) {
            try {
                const models = await client.plugin.models()
                setModels(models.map(m => ({ id: m.id, name: m.name })))
                const currentModel = await client.plugin.currentModel()
                if (currentModel) {
                    const hotkeys = await currentModel.hotkeys()
                    setHotkeys(hotkeys.map(h => ({ id: h.id, name: h.name })))
                } else {
                    setHotkeys([])
                }
                setApiError(null)
            } catch (e) {
                console.error(e)
                setApiError(e)
            }
        }
    }, [client, connected])
    useInterval(refreshDropdowns, 10 * 1000, true)

    const pollSwapRedeems = React.useCallback(async () => {
        if (pollSwapDebounce) return
        setPollSwapDebounce(true)
        const pendingSwaps = props.state.swaps.filter(s => !redeemedSwaps[s.id])
        const resolvedSwaps: Record<string, boolean> = {}
        for (const swap of pendingSwaps) {
            try {
                const config = props.config.swaps.find(c => c.id === swap.configID)
                if (config) {
                    const models = await client.plugin.models()
                    const currentModel = await client.plugin.currentModel()
                    const validModels = models.filter(m => config.models.some(c => c.id === m.id || c.name === m.name) && m.id !== currentModel?.id && m.name !== currentModel?.name)
                    let selectedModel

                    if (config.type === 'one') selectedModel = validModels[0]
                    else if (config.type === 'any') selectedModel = randomItem(validModels)
                    else if (config.type === 'weighted-any') selectedModel = randomWeightedItem(validModels, m => config.models.find(c => c.id === m.id || c.name === m.name)?.weight ?? 1)

                    if (selectedModel) {
                        await selectedModel.load()
                        await Promise.all([
                            (async () => {
                                await wait(Math.max(config.duration * 1000, VTS_MODEL_SWAP_COOLDOWN))
                                await channelAction('vtstudio/complete-model-swap', { id: swap.id })
                            })(),
                            (async () => {
                                if (config.after === 'revert') {
                                    await wait(Math.max((config.revertDelay ?? config.duration) * 1000, VTS_MODEL_SWAP_COOLDOWN))
                                    await models.find(m => m.id === currentModel?.id || m.name === currentModel?.name)?.load()
                                    await wait(VTS_MODEL_SWAP_COOLDOWN)
                                }
                            })(),
                        ])
                        resolvedSwaps[swap.id] = true
                    }
                }
            } catch (e) {
                console.error(e)
                setApiError(e)
            }
        }
        setRedeemedSwaps({ ...redeemedSwaps, ...resolvedSwaps })
        setPollSwapDebounce(false)
    }, [redeemedSwaps, pollSwapDebounce, props.state.swaps])
    useInterval(pollSwapRedeems, 1000, false)

    const pollTriggerRedeems = React.useCallback(async () => {
        if (pollTriggerDebounce) return
        setPollTriggerDebounce(true)
        const pendingTriggers = props.state.triggers.filter(s => !redeemedTriggers[s.id])
        const resolvedTriggers: Record<string, boolean> = {}
        for (const trigger of pendingTriggers) {
            try {
                const config = props.config.triggers.find(c => c.id === trigger.configID)
                if (config) {
                    const currentModel = await client.plugin.currentModel()
                    if (currentModel) {
                        const hotkeys = await currentModel.hotkeys()
                        const validHotkeys = hotkeys.filter(h => config.hotkeys.some(c => c.id === h.id || c.name === h.name))
                        let selectedHotkeys
                        if (validHotkeys.length) {
                            if (config.type === 'one') selectedHotkeys = [validHotkeys[0]]
                            else if (config.type === 'any') selectedHotkeys = [randomItem(validHotkeys)]
                            else if (config.type === 'weighted-any') selectedHotkeys = [randomWeightedItem(validHotkeys, h => config.hotkeys.find(c => c.id === h.id || c.name === h.name)?.weight ?? 1)]
                            else if (config.type === 'all') selectedHotkeys = validHotkeys
                        }
                        if (selectedHotkeys && selectedHotkeys.length) {
                            await Promise.all(selectedHotkeys.map(h => h.trigger()))
                            await Promise.all([
                                (async () => {
                                    await wait(config.duration * 1000)
                                    await channelAction('vtstudio/complete-hotkey-trigger', { id: trigger.id })
                                })(),
                                (async () => {
                                    if (config.after === 'retrigger') {
                                        await wait((config.retriggerDelay ?? config.duration) * 1000)
                                        await Promise.all(selectedHotkeys.map(h => h.trigger()))
                                    }
                                })(),
                            ])
                            resolvedTriggers[trigger.id] = true
                        }
                    }
                }
            } catch (e) {
                console.error(e)
                setApiError(e)
            }
        }
        setRedeemedTriggers({ ...redeemedTriggers, ...resolvedTriggers })
        setPollTriggerDebounce(false)
    }, [redeemedTriggers, pollTriggerDebounce, props.state.triggers])
    useInterval(pollTriggerRedeems, 1000, false)

    const modelOptions: DropdownOption[] = [...models, ...props.config.swaps.flatMap(c => c.models).filter(m => !models.some(o => o.id === m.id || o.name === m.name)).map(m => ({ ...m, name: `${m.name}*` }))].map(m => ({ value: m.id, text: m.name }))

    const hotkeyOptions: DropdownOption[] = [...hotkeys, ...props.config.triggers.flatMap(c => c.hotkeys).filter(h => !hotkeys.some(o => o.id === h.id || o.name === h.name)).map(h => ({ ...h, name: `${h.name}*` }))].map(h => ({ value: h.id, text: h.name }))

    const modelTypeLabels: Record<ModelSwapConfig['type'], string> = {
        one: 'Single Model',
        any: 'Random Model',
        "weighted-any": 'Random Model (Weighted)',
    }

    const modelTypeOptions: DropdownOption[] = Object.entries(modelTypeLabels).map(([value, text]) => ({ value, text }))

    const modelAfterLabels: Record<Exclude<ModelSwapConfig['after'], undefined>, string> = {
        nothing: 'Do Nothing',
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
        retrigger: 'Retrigger Hotkeys',
    }

    const hotkeyAfterOptions: DropdownOption[] = Object.entries(hotkeyAfterLabels).map(([value, text]) => ({ value, text }))

    const indicator = <>
        <div className={classes('VTubeStudioIndicator', { connected })}>VTube Studio</div>
        {connected ? <PanelField>
            <Alert type="success">Connected to VTube Studio! Configured redeems will trigger and lists will be populated based on the currently loaded model.</Alert>
        </PanelField> : null}
        {!connected ? <PanelField>
            <Alert type="warn" tooltip={`Connection status: ${['Connecting', 'Connected', 'Disconnecting', 'Disconnected'][client?.ws.readyState ?? 3]}`}>Not connected to VTube Studio. Redeems will not work and lists will not populate until the connection is reestablished.</Alert>
        </PanelField> : null}
        {apiError !== null ? <PanelField>
            <Alert type="fail" tooltip={String(apiError)}>An error occurred while communicating with VTube Studio.</Alert>
        </PanelField> : null}
    </>

    switch (props.page) {
        case ControlPanelPage.view:
            return <>
                {indicator}
                <PanelField>
                    <div className="QueuedItemList">
                        {props.state.swaps.length
                            ? props.state.swaps.map(s => <QueuedSwap key={s.id} swap={s} config={props.config.swaps.find(c => c.id === s.configID)!} />)
                            : <i>No model swaps in queue</i>}
                    </div>
                </PanelField>
                <PanelField>
                    <div className="QueuedItemList">
                        {props.state.triggers.length
                            ? props.state.triggers.map(s => <QueuedTrigger key={s.id} trigger={s} config={props.config.triggers.find(c => c.id === s.configID)!} />)
                            : <i>No hotkey triggers in queue</i>}
                    </div>
                </PanelField>
            </>
        case ControlPanelPage.edit:
            return <>
                <hr />
                {indicator}
                <hr />
                <PanelField label="Model Swaps"><div></div></PanelField>
                <PanelField>
                    <div className="QueuedItemList">
                        {props.config.swaps.map(c => <div key={c.id} className="QueuedItem">
                            <PanelField label="Reward" help="This is the channel point reward in Twitch that will trigger this model swap.">
                                <TwitchRewardDropdown nullable selectedID={c.redeemID} selectedName={c.redeemName} onSelect={(id, name) => channelAction('vtstudio/edit-model-swap', { id: c.id, redeemID: id, redeemName: name })} />
                            </PanelField>
                            {(props.panel.items?.[c.id] ?? true) ? <>
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
                                    <input type="number" step="any" defaultValue={c.duration} onChange={e => channelAction('vtstudio/edit-model-swap', { id: c.id, duration: parseInt(e.target.value) })} />&nbsp;seconds
                                </PanelField>
                                <PanelField label="Type" help="How the model being swapped in will be determined.">
                                    <Dropdown selected={c.type} options={modelTypeOptions} onSelect={v => channelAction('vtstudio/edit-model-swap', { id: c.id, type: v as ModelSwapConfig['type'] })} />
                                </PanelField>
                                {c.type === 'one' ? <PanelField label="Model" help="The model that will be swapped in.">
                                    <Dropdown selected={c.models[0]?.id ?? ''} options={modelOptions} onSelect={v => channelAction('vtstudio/edit-model-swap', { id: c.id, models: v ? [{ id: v, name: models.find(m => m.id === v)?.name ?? '' }] : [] })} nullable />
                                </PanelField> : c.type === 'weighted-any' ? <PanelField>
                                    <div className="QueuedItemList">
                                        {c.models.map((m, i) => <div key={m.id} className="QueuedItem">
                                            <PanelField label="Model" help="The model that will be swapped in, and its chance of being picked relative to other models (higher means more likely).">
                                                <Dropdown selected={m.id} nullable nullText="(Remove)" options={modelOptions.filter(o => !c.models.some(e => e.id === o.value && e.id !== m.id))} onSelect={(v, n) => channelAction('vtstudio/edit-model-swap', { id: c.id, models: v ? [...c.models.slice(0, i), { id: v, name: n, weight: m.weight }, ...c.models.slice(i + 1)] : [...c.models.slice(0, i), ...c.models.slice(i + 1)] })} />
                                                &nbsp;
                                                <input type="number" step="any" defaultValue={m.weight ?? 1} onChange={e => channelAction('vtstudio/edit-model-swap', { id: c.id, models: [...c.models.slice(0, i), { ...m, weight: Number.isNaN(e.target.valueAsNumber) ? m.weight : e.target.valueAsNumber ?? m.weight }, ...c.models.slice(i + 1)] })} />
                                                &nbsp;chances
                                            </PanelField>
                                        </div>)}
                                        Add Model:&nbsp;<Dropdown selected='' nullable options={modelOptions.filter(o => !c.models.some(e => e.id === o.value))} onSelect={(v, n) => channelAction('vtstudio/edit-model-swap', { id: c.id, models: [...c.models, { id: v, name: n, weight: 1 }] })} />
                                    </div>
                                </PanelField> : <PanelField label="Models" help="The list of models that the swapped in model will be selected from.">
                                    <TagList selected={c.models.map(m => m.id)} options={modelOptions} onSelect={v => channelAction('vtstudio/edit-model-swap', { id: c.id, models: [...c.models, { id: v, name: models.find(m => m.id === v)?.name ?? '' }] })} onDeselect={v => channelAction('vtstudio/edit-model-swap', { id: c.id, models: c.models.filter(m => m.id !== v) })} />
                                </PanelField>}
                                <PanelField label="After" help="The action to take after the model swap has completed.">
                                    <Dropdown selected={c.after ?? 'nothing'} options={modelAfterOptions} onSelect={v => channelAction('vtstudio/edit-model-swap', { id: c.id, after: v as ModelSwapConfig['after'] })} />
                                </PanelField>
                                {c.after === 'revert' ? <PanelField label="Revert Delay" help="How long to wait before reverting to the previous model. If blank, defaults to the Duration.">
                                    <input type="number" step="any" defaultValue={c.revertDelay ?? undefined} onChange={e => channelAction('vtstudio/edit-model-swap', { id: c.id, revertDelay: Number.isNaN(e.target.valueAsNumber) ? null : e.target.valueAsNumber })} />&nbsp;seconds
                                </PanelField> : null}
                                <PanelField>
                                    <Button onClick={() => mockEvent(c.id, 'model-swap')}>Test model swap</Button>
                                    {c.id === tested ? <>&nbsp;<span>Success! Check the main tab!</span></> : <></>}
                                </PanelField>
                                <PanelField>
                                    <Button onClick={() => channelAction('vtstudio/delete-model-swap', { id: c.id })}>Delete model swap</Button>
                                </PanelField>
                            </> : <Fold />}
                            <Expander open={props.panel.items?.[c.id] ?? true} onToggle={open => props.onToggleItem(c.id, open)} />
                        </div>)}
                    </div>
                </PanelField>
                {modelOptions.some(o => o.text?.endsWith('*')) ? <PanelField>
                    <i>* Model is not currently loaded or VTube Studio is not connected</i>
                </PanelField> : null}
                <PanelField>
                    <Button primary onClick={() => channelAction('vtstudio/add-model-swap', {})}>Add new model swap</Button>
                </PanelField>
                <PanelField label="Hotkey Triggers"><div></div></PanelField>
                <PanelField>
                    <div className="QueuedItemList">
                        {props.config.triggers.map(c => <div key={c.id} className="QueuedItem">
                            <PanelField label="Reward" help="This is the channel point reward in Twitch that will trigger this hotkey trigger.">
                                <TwitchRewardDropdown nullable selectedID={c.redeemID} selectedName={c.redeemName} onSelect={(id, name) => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, redeemID: id, redeemName: name })} />
                            </PanelField>
                            {(props.panel.items?.[c.id] ?? true) ? <>
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
                                    <input type="number" step="any" defaultValue={c.duration} onChange={e => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, duration: parseInt(e.target.value) })} />&nbsp;seconds
                                </PanelField>
                                <PanelField label="Type" help="How the hotkey being triggered will be determined.">
                                    <Dropdown selected={c.type} options={hotkeyTypeOptions} onSelect={v => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, type: v as TriggerHotkeyConfig['type'] })} />
                                </PanelField>
                                {c.type === 'one' ? <PanelField label="Hotkey" help="The hotkey that will be triggered.">
                                    <Dropdown selected={c.hotkeys[0]?.id ?? ''} options={hotkeyOptions} onSelect={v => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, hotkeys: v ? [{ id: v, name: hotkeys.find(h => h.id === v)?.name ?? '' }] : [] })} nullable />
                                </PanelField> : c.type === 'weighted-any' ? <PanelField>
                                    <div className="QueuedItemList">
                                        {c.hotkeys.map((h, i) => <div key={h.id} className="QueuedItem">
                                            <PanelField label="Hotkey" help="The hotkey that will be triggered, and its chance of being picked relative to other hotkeys (higher means more likely).">
                                                <Dropdown selected={h.id} nullable nullText="(Remove)" options={hotkeyOptions.filter(o => !c.hotkeys.some(e => e.id === o.value && e.id !== h.id))} onSelect={(v, n) => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, hotkeys: v ? [...c.hotkeys.slice(0, i), { id: v, name: n, weight: h.weight }, ...c.hotkeys.slice(i + 1)] : [...c.hotkeys.slice(0, i), ...c.hotkeys.slice(i + 1)] })} />
                                                &nbsp;
                                                <input type="number" step="any" defaultValue={h.weight ?? 1} onChange={e => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, hotkeys: [...c.hotkeys.slice(0, i), { ...h, weight: Number.isNaN(e.target.valueAsNumber) ? h.weight : e.target.valueAsNumber ?? h.weight }, ...c.hotkeys.slice(i + 1)] })} />
                                                &nbsp;chances
                                            </PanelField>
                                        </div>)}
                                        Add Hotkey:&nbsp;<Dropdown selected='' nullable options={hotkeyOptions.filter(o => !c.hotkeys.some(e => e.id === o.value))} onSelect={(v, n) => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, hotkeys: [...c.hotkeys, { id: v, name: n, weight: 1 }] })} />
                                    </div>
                                </PanelField> : <PanelField label="Hotkeys" help="The list of hotkeys that the triggered hotkey will be selected from.">
                                    <TagList selected={c.hotkeys.map(h => h.id)} options={hotkeyOptions} onSelect={v => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, hotkeys: [...c.hotkeys, { id: v, name: hotkeys.find(h => h.id === v)?.name ?? '' }] })} onDeselect={v => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, hotkeys: c.hotkeys.filter(h => h.id !== v) })} />
                                </PanelField>}
                                <PanelField label="After" help="The action to take after the hotkey trigger has completed.">
                                    <Dropdown selected={c.after ?? 'nothing'} options={hotkeyAfterOptions} onSelect={v => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, after: v as TriggerHotkeyConfig['after'] })} />
                                </PanelField>
                                {c.after === 'retrigger' ? <PanelField label="Retrigger Delay" help="How long to wait before triggering the hotkey again. If blank, defaults to the Duration.">
                                    <input type="number" step="any" defaultValue={c.retriggerDelay ?? undefined} onChange={e => channelAction('vtstudio/edit-hotkey-trigger', { id: c.id, retriggerDelay: Number.isNaN(e.target.valueAsNumber) ? null : e.target.valueAsNumber })} />&nbsp;seconds
                                </PanelField> : null}
                                <PanelField>
                                    <Button onClick={() => mockEvent(c.id, 'hotkey-trigger')}>Test hotkey trigger</Button>
                                    {c.id === tested ? <>&nbsp;<span>Success! Check the main tab!</span></> : <></>}
                                </PanelField>
                                <PanelField>
                                    <Button onClick={() => channelAction('vtstudio/delete-hotkey-trigger', { id: c.id })}>Delete hotkey trigger</Button>
                                </PanelField>
                            </> : <Fold />}
                            <Expander open={props.panel.items?.[c.id] ?? true} onToggle={open => props.onToggleItem(c.id, open)} />
                        </div>)}
                    </div>
                </PanelField>
                {hotkeyOptions.some(o => o.text?.endsWith('*')) ? <PanelField>
                    <i>* Hotkey does not exist on the currently loaded model or VTube Studio is not connected</i>
                </PanelField> : null}
                <PanelField>
                    <Button primary onClick={() => channelAction('vtstudio/add-hotkey-trigger', {})}>Add new hotkey trigger</Button>
                </PanelField>
                <hr />
                <PanelField label="API Host" help="The URL to connect to VTube Studio at. When using Cheers Bot on the same device as VTube Studio you will want to leave this as 'localhost'.">
                    <input type="text" value={props.config.apiHost} onChange={e => channelAction('vtstudio/edit-config', { apiHost: e.target.value || props.config.apiHost })} />
                </PanelField>
                <PanelField label="API Port" help="The port to connect to VTube Studio at. This should match the value configured in VTube Studio.">
                    <input type="number" step="any" value={props.config.apiPort} onChange={e => channelAction('vtstudio/edit-config', { apiPort: e.target.valueAsNumber || props.config.apiPort })} />
                </PanelField>
                <PanelField label="API Secured" help="Whether to use secure websocket protocol when connecting to VTube Studio. When using Cheers Bot on the same device as VTube Studio you will want to leave this off.">
                    <Toggle value={props.config.apiSecure} onToggle={v => channelAction('vtstudio/edit-config', { apiSecure: v })} />
                </PanelField>
            </>
        default:
            return <></>
    }
}
