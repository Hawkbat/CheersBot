import { ControlPanelAppViewData, PanelViewData, ControlPanelPage, getModule, AccountType, ModuleVersion, logError, popLogBuffer } from 'shared'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { channelView, classes, localRetrieveJSON, localStoreJSON, getChannelCSS, channelAction, useRepeatingEffect, globalAction } from '../utils'
import { Panel } from '../controls/Panel'
import { TabSet } from '../controls/TabSet'
import { AccessPanel } from '../panels/AccessPanel'
import { Changelog } from '../controls/Changelog'
import { InfoPopupProvider } from '../controls/InfoPopup'
import { PanelGroup } from '../controls/PanelGroup'
import { PanelField } from '../controls/PanelField'
import { Button } from '../controls/Button'
import { Alert } from '../controls/Alert'
import { HelpWindow } from '../controls/HelpWindow'

let lastPingTime = Date.now()
let debounce = false

let cachedData: ControlPanelAppViewData | undefined
let pendingViewPromise: Promise<ControlPanelAppViewData | undefined> | undefined

export async function refresh(reloadData: boolean) {
    if (debounce) return
    debounce = true
    try {
        const data = reloadData || !cachedData ? await (pendingViewPromise ?? (pendingViewPromise = channelView('controlpanel-app'))) : cachedData
        pendingViewPromise = undefined
        if (data) {
            cachedData = data
            if (reloadData && data.refreshTime !== REFRESH_TIME) location.reload()
            ReactDOM.render(<ControlPanelApp {...data} />, document.getElementById('app'))

            const pingTime = Date.now()

            const finishedModes = data.modules.modeQueue.state.modes.filter(m => m.startTime && lastPingTime < (m.startTime + (m.duration ?? 0)) && pingTime >= (m.startTime + (m.duration ?? 0)))
            const autoEndModes = finishedModes.filter(m => !!data.modules.modeQueue.config.modes.find(c => c.id === m.configID)?.autoEnd)

            if (finishedModes.length > 0 && finishedModes.length > autoEndModes.length) {
                try {
                    const alarm = document.getElementById('alarm') as HTMLAudioElement
                    alarm.volume = data.modules.modeQueue.config.alarmVolume ?? 1
                    alarm.play()
                } catch (e) { }
            }

            lastPingTime = pingTime
        }
    } catch (e) {
        logError(CHANNEL_NAME, 'control-panel', 'Error refreshing control panel', e)
    }
    debounce = false
}

export function ControlPanelApp(props: ControlPanelAppViewData) {
    const initialPage = location.hash ? (ControlPanelPage as any)[location.hash.substr(1)] as ControlPanelPage : undefined
    const [page, setPage] = React.useState(initialPage ?? ControlPanelPage.view)

    const PANEL_STATE_KEY = `cheers-bot/${props.username}/${props.channel}/panels/${page}`

    const [panels, setPanels] = React.useState<PanelViewData[]>([])

    React.useEffect(() => {
        location.hash = {
            [ControlPanelPage.view]: 'view',
            [ControlPanelPage.edit]: 'edit',
            [ControlPanelPage.access]: 'access',
        }[page]
    }, [page])

    React.useEffect(() => {
        const savedPanels = localRetrieveJSON<PanelViewData[]>(PANEL_STATE_KEY, [])
        const sortedPanels = props.panels.slice().sort((a, b) => {
            let ai = savedPanels.findIndex(p => p.type === a)
            let bi = savedPanels.findIndex(p => p.type === b)
            if (ai === -1 || bi === -1) {
                ai = props.panels.findIndex(p => p === a)
                bi = props.panels.findIndex(p => p === b)
            }
            return ai - bi
        }).map(p => savedPanels.find(o => o.type === p) ?? { type: p, open: true })
        setPanels(sortedPanels)
    }, [page, props.panels])

    React.useEffect(() => {
        window.addEventListener('error', e => logError(CHANNEL_NAME, 'control-panel', e.message, e.filename, e.lineno, e.colno, e.error))
    }, [])

    useRepeatingEffect(React.useCallback(async () => {
        await channelAction('debug/send-logs', { logs: popLogBuffer() })
    }, []), 60 * 1000, false)

    const visiblePanels = panels.filter(p => {
        const module = getModule(p.type)
        if (module.version === ModuleVersion.girldm && !props.isGirlDm && props.channel.toLowerCase() !== 'girl_dm_') return false
        const isExperimental = [ModuleVersion.preAlpha, ModuleVersion.alpha].includes(module.version)
        if (isExperimental && !props.modules.channelInfo.config.experimentalModules) return false
        switch (page) {
            case ControlPanelPage.edit: return module !== null
            case ControlPanelPage.view: return !module || module.getData(props.modules).config.enabled
            case ControlPanelPage.access: return false
        }
    })

    const movePanels = (startIndex: number, endIndex: number) => {
        setPanels(v => {
            const arr = [...v]
            startIndex = arr.findIndex(p => p === visiblePanels[startIndex])
            endIndex = arr.findIndex(p => p === visiblePanels[endIndex])
            arr.splice(endIndex, 0, ...arr.splice(startIndex, 1))
            localStoreJSON(PANEL_STATE_KEY, arr)
            return arr
        })
    }

    const togglePanel = (type: string, open: boolean) => {
        setPanels(v => {
            const arr = [...v]
            const index = arr.findIndex(p => p.type === type)
            arr[index].open = open
            localStoreJSON(PANEL_STATE_KEY, arr)
            return arr
        })
    }

    const togglePanelItem = (type: string, id: string, open: boolean) => {
        setPanels(v => {
            const arr = [...v]
            const index = arr.findIndex(p => p.type === type)
            const items = arr[index].items ?? {}
            items[id] = open
            arr[index].items = items
            localStoreJSON(PANEL_STATE_KEY, arr)
            return arr
        })
    }

    if (props.tokenInvalid) {
        return <div className='ModalOverlay' onClick={() => { }}>
            <div className='Modal UploadWindow' onClick={() => { }}>
                <PanelField>
                    <Alert type="fail">
                        <div>This channel's Twitch connection has expired and could not be automatically refreshed. Please <a href="/authorize/channel/">re-connect your channel account</a>.</div>
                    </Alert>
                </PanelField>
            </div>
        </div>
    }

    return <div className={classes('ControlPanel')} style={getChannelCSS(props.modules.channelInfo.config)}>
        <InfoPopupProvider>
            <DragDropContext onDragEnd={(result, provided) => {
                if (result.destination) movePanels(result.source.index, result.destination.index)
            }}>
                <TabSet selected={page} options={[
                    { value: ControlPanelPage.view, icon: 'sliders-h' },
                    { value: ControlPanelPage.edit, icon: 'cogs' },
                    { value: ControlPanelPage.access, icon: 'users' },
                ]} onSelect={v => setPage(v as ControlPanelPage)} />
                <Droppable droppableId={'control-panel'}>
                    {(provided, snapshot) => <div className={classes("droppable", { dropping: snapshot.isDraggingOver })} ref={provided.innerRef} {...provided.droppableProps}>
                        {page === ControlPanelPage.access
                            ? <>
                                {props.isSuperUser ? <Draggable key="admin" draggableId="admin" index={0}>
                                    {(provided, snapshot) => <div className={classes('draggable', { dragging: snapshot.isDragging })} {...provided.draggableProps} ref={provided.innerRef}>
                                        <PanelGroup label="Admin">
                                            <PanelField>
                                                <Button onClick={() => channelAction('admin/lock-channel', {})}>Lock</Button>
                                                <Button onClick={() => channelAction('admin/unlock-channel', {})}>Unlock</Button>
                                                <Button onClick={() => channelAction('admin/reload-channel', {})}>Reload</Button>
                                            </PanelField>
                                            <PanelField>
                                                <Button onClick={() => confirm('This will stall the server for up to a full minute while a heapdump is created. Make sure nobody is actively using the plugin before doing this. Continue?') && globalAction('admin/heapdump', {})}>Server Heap Dump</Button>
                                            </PanelField>
                                        </PanelGroup>
                                        <div className="dragger" {...provided.dragHandleProps}></div>
                                    </div>}
                                </Draggable> : null}
                                <Draggable key={AccountType.bot} draggableId={AccountType.bot} index={0}>
                                    {(provided, snapshot) => <div className={classes('draggable', { dragging: snapshot.isDragging })} {...provided.draggableProps} ref={provided.innerRef}>
                                        <AccessPanel userType={AccountType.channel} targetType={AccountType.bot} access={props.botAccess} />
                                        <div className="dragger" {...provided.dragHandleProps}></div>
                                    </div>}
                                </Draggable>
                                <Draggable key={AccountType.user} draggableId={AccountType.user} index={1}>
                                    {(provided, snapshot) => <div className={classes('draggable', { dragging: snapshot.isDragging })} {...provided.draggableProps} ref={provided.innerRef}>
                                        <AccessPanel userType={AccountType.channel} targetType={AccountType.user} access={props.userAccess} />
                                        <div className="dragger" {...provided.dragHandleProps}></div>
                                    </div>}
                                </Draggable>
                            </>
                            : visiblePanels.map((p, i) =>
                                <Draggable key={p.type} draggableId={p.type} index={i}>
                                    {(provided, snapshot) => <div className={classes('draggable', { dragging: snapshot.isDragging })} {...provided.draggableProps} ref={provided.innerRef}>
                                        <Panel page={page} data={props} panel={p} onToggle={open => togglePanel(p.type, open)} onToggleItem={(id, open) => togglePanelItem(p.type, id, open)} />
                                        <div className="dragger" {...provided.dragHandleProps}></div>
                                    </div>}
                                </Draggable>
                            )}
                        {provided.placeholder}
                    </div>}
                </Droppable>
            </DragDropContext>
        </InfoPopupProvider>
        <Changelog changelog={props.changelog.changelog} />
        <HelpWindow />
    </div>
}
