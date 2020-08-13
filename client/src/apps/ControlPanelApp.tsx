import { ControlPanelViewData, PanelViewData, ControlPanelPage, getModule, Access, AccountType } from 'shared'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { channelView, classes, localRetrieveJSON, localStoreJSON, channelAction } from '../utils'
import { Panel } from '../controls/Panel'
import { TabSet } from '../controls/TabSet'
import { AccessPanel } from 'src/panels/AccessPanel'

declare const REFRESH_TIME: number

let lastPingTime = Date.now()
let debounce = false

export async function refresh() {
    if (debounce) return
    debounce = true
    try {
        const data = await channelView('controlpanel')
        if (data) {
            if (data.refreshTime !== REFRESH_TIME) location.reload()
            ReactDOM.render(<ControlPanelApp {...data} updateTime={new Date()} />, document.getElementById('app'))

            const pingTime = Date.now()
            if (data.channelData.modules.modeQueue.modes.some(m => m.startTime && lastPingTime < (m.startTime + (m.duration ?? 0)) && pingTime >= (m.startTime + (m.duration ?? 0)))) {
                try {
                    const alarm = document.getElementById('alarm') as HTMLAudioElement
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

export function ControlPanelApp(props: ControlPanelViewData) {
    const [page, setPage] = React.useState(ControlPanelPage.view)

    const PANEL_STATE_KEY = `cheers-bot/${props.username}/${props.channel}/panels/${page}`

    const [panels, setPanels] = React.useState(props.panels)

    const localPanels = localRetrieveJSON<PanelViewData[]>(PANEL_STATE_KEY, [])
    const sortedPanels = panels.slice().sort((a, b) => {
        let ai = localPanels.findIndex(p => p.type === a.type)
        let bi = localPanels.findIndex(p => p.type === b.type)
        if (ai === -1 || bi === -1) {
            ai = panels.findIndex(p => p.type === a.type)
            bi = panels.findIndex(p => p.type === b.type)
        }
        return ai - bi
    }).map(p => localPanels.find(o => o.type === p.type) ?? p).filter(p => {
        const module = getModule(p.type)
        switch (page) {
            case ControlPanelPage.edit: return module !== null
            case ControlPanelPage.view: return !module || module.getData(props.channelData).enabled
            case ControlPanelPage.access: return false
        }
    })

    const movePanels = (startIndex: number, endIndex: number) => {
        setPanels(v => {
            5
            const arr = [...v]
            arr.splice(endIndex, 0, ...arr.splice(startIndex, 1))
            localStoreJSON(PANEL_STATE_KEY, arr)
            return arr
        })
    }

    const togglePanel = (index: number, open: boolean) => {
        setPanels(v => {
            const arr = [...v]
            arr[index].open = open
            localStoreJSON(PANEL_STATE_KEY, arr)
            return arr
        })
    }

    return <>
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
                        ? [AccountType.bot, AccountType.user].map((type, i) =>
                            <Draggable key={type} draggableId={type} index={i}>
                                {(provided, snapshot) => <div className={classes('draggable', { dragging: snapshot.isDragging })} {...provided.draggableProps} ref={provided.innerRef}>
                                    <AccessPanel type={type} data={props.channelData} />
                                    <div className="dragger" {...provided.dragHandleProps}></div>
                                </div>}
                            </Draggable>
                        )
                        : sortedPanels.map((p, i) =>
                            <Draggable key={p.type} draggableId={p.type} index={i}>
                                {(provided, snapshot) => <div className={classes('draggable', { dragging: snapshot.isDragging })} {...provided.draggableProps} ref={provided.innerRef}>
                                    <Panel page={page} data={props} panel={p} onToggle={open => togglePanel(i, open)} />
                                    <div className="dragger" {...provided.dragHandleProps}></div>
                                </div>}
                            </Draggable>
                        )}
                    {provided.placeholder}
                </div>}
            </Droppable>
        </DragDropContext>
    </>
}
