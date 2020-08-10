import { ControlPanelViewData, PanelViewData, PanelType, ModuleData } from 'shared'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { Panel } from '../controls/Panel'
import { getJSON, classes, localRetrieveJSON, localStoreJSON } from '../utils'

declare const REFRESH_TIME: number

export async function post(url: string, data: any) {
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    await refresh()
}

let lastPingTime = Date.now()
let debounce = false

export async function refresh() {
    if (debounce) return
    debounce = true
    try {
        const data = await getJSON<ControlPanelViewData>('data/controlpanel/')
        if (data) {
            if (data.refreshTime !== REFRESH_TIME) location.reload()
            ReactDOM.render(<ControlPanelApp {...data} updateTime={new Date()} />, document.getElementById('app'))

            const pingTime = Date.now()
            if (data.data.modules.modeQueue.modes.some(m => m.startTime && lastPingTime < (m.startTime + (m.duration ?? 0)) && pingTime >= (m.startTime + (m.duration ?? 0)))) {
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
    const PANEL_STATE_KEY = `cheers-bot/${props.username}/${props.channel}/panels`

    const localPanels = localRetrieveJSON<PanelViewData[]>(PANEL_STATE_KEY, [])
    const allPanels = props.panels.slice().sort((a, b) => {
        let ai = localPanels.findIndex(p => p.type === a.type)
        let bi = localPanels.findIndex(p => p.type === b.type)
        if (ai === -1 || bi === -1) {
            ai = props.panels.findIndex(p => p.type === a.type)
            bi = props.panels.findIndex(p => p.type === b.type)
        }
        return ai - bi
    }).map(p => localPanels.find(o => o.type === p.type) ?? p)

    const [panels, setPanels] = React.useState(allPanels)

    const filteredPanels = panels.filter(p => {
        let module: ModuleData | null = null
        switch (p.type) {
            case PanelType.headpats:
                module = props.data.modules.headpats
                break
            case PanelType.evilDM:
                module = props.data.modules.evilDm
                break
            case PanelType.modeQueue:
                module = props.data.modules.modeQueue
                break
            case PanelType.userQueue:
                module = props.data.modules.userQueue
                break
            case PanelType.debug:
                module = props.data.modules.debug
                break
        }
        if (module && !module.enabled) return false
        return true
    })

    const movePanels = (startIndex: number, endIndex: number) => {
        setPanels(v => {
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
            <Droppable droppableId={'control-panel'}>
                {(provided, snapshot) => <div className={classes("droppable", { dropping: snapshot.isDraggingOver })} ref={provided.innerRef} {...provided.droppableProps}>
                    {filteredPanels.map((p, i) =>
                        <Draggable key={p.type} draggableId={p.type} index={i}>
                            {(provided, snapshot) => <div className={classes('draggable', { dragging: snapshot.isDragging })} {...provided.draggableProps} ref={provided.innerRef}>
                                <Panel data={props} panel={p} onToggle={open => togglePanel(i, open)} />
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
