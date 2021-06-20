import { ControlPanelAppViewData, PanelViewData, ControlPanelPage, getModule, AccountType, ModuleVersion } from 'shared'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { channelView, classes, localRetrieveJSON, localStoreJSON, getChannelCSS } from '../utils'
import { Panel } from '../controls/Panel'
import { TabSet } from '../controls/TabSet'
import { AccessPanel } from '../panels/AccessPanel'
import { Changelog } from '../controls/Changelog'
import { InfoPopupProvider } from '../controls/InfoPopup'

declare const REFRESH_TIME: number

let lastPingTime = Date.now()
let debounce = false

let cachedData: ControlPanelAppViewData | undefined

export async function refresh(reloadData: boolean) {
    if (debounce) return
    debounce = true
    try {
        const data = reloadData || !cachedData ? await channelView('controlpanel-app') : cachedData
        if (data) {
            cachedData = data
            if (data.refreshTime !== REFRESH_TIME) location.reload()
            ReactDOM.render(<ControlPanelApp {...data} updateTime={new Date()} />, document.getElementById('app'))

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
        console.error(e)
    }
    debounce = false
}

export function ControlPanelApp(props: ControlPanelAppViewData) {
    const [page, setPage] = React.useState(ControlPanelPage.view)

    const PANEL_STATE_KEY = `cheers-bot/${props.username}/${props.channel}/panels/${page}`

    const [panels, setPanels] = React.useState<PanelViewData[]>([])

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

    const visiblePanels = panels.filter(p => {
        const module = getModule(p.type)
        const isExperimental = [ModuleVersion.preAlpha, ModuleVersion.alpha, ModuleVersion.girldm].includes(module.version)
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

    return <div className={classes('ControlPanel')} style={getChannelCSS(props.modules.channelInfo.config)}>
        <InfoPopupProvider>
            <DragDropContext onDragEnd={(result, provided) => {
                if (result.destination) movePanels(result.source.index, result.destination.index)
            }}>
                <Changelog changelog={props.changelog.changelog} />
                <TabSet selected={page} options={[
                    { value: ControlPanelPage.view, icon: 'sliders-h' },
                    { value: ControlPanelPage.edit, icon: 'cogs' },
                    { value: ControlPanelPage.access, icon: 'users' },
                ]} onSelect={v => setPage(v as ControlPanelPage)} />
                <Droppable droppableId={'control-panel'}>
                    {(provided, snapshot) => <div className={classes("droppable", { dropping: snapshot.isDraggingOver })} ref={provided.innerRef} {...provided.droppableProps}>
                        {page === ControlPanelPage.access
                            ? <>
                                <Draggable key={AccountType.bot} draggableId={AccountType.bot} index={0}>
                                    {(provided, snapshot) => <div className={classes('draggable', { dragging: snapshot.isDragging })} {...provided.draggableProps} ref={provided.innerRef}>
                                        <AccessPanel type={AccountType.bot} access={props.botAccess} />
                                        <div className="dragger" {...provided.dragHandleProps}></div>
                                    </div>}
                                </Draggable>
                                <Draggable key={AccountType.user} draggableId={AccountType.user} index={1}>
                                    {(provided, snapshot) => <div className={classes('draggable', { dragging: snapshot.isDragging })} {...provided.draggableProps} ref={provided.innerRef}>
                                        <AccessPanel type={AccountType.user} access={props.userAccess} />
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
    </div>
}
