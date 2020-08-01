import * as React from 'react'
import { ControlPanelViewData, PanelType, PanelViewData } from 'shared'
import { PanelGroup } from './PanelGroup'
import { HeadpatsPanel } from '../panels/HeadpatsPanel'
import { EventQueuePanel } from '../panels/EventQueuePanel'
import { UserAndChannelPanel } from '../panels/UserAndChannelPanel'
import { DebugPanel } from '../panels/DebugPanel'
import { EvilDmPanel } from '../panels/EvilDmPanel'

export function Panel(props: { panel: PanelViewData, data: ControlPanelViewData, onToggle: (open: boolean) => void }) {
    return <PanelGroup open={props.panel.open} onToggle={open => props.onToggle(open)} label={props.panel.type}>{(() => {
        switch (props.panel.type) {
            case PanelType.headpats:
                return <HeadpatsPanel {...props.data} />
            case PanelType.evilDM:
                return <EvilDmPanel {...props.data} />
            case PanelType.eventQueue:
                return <EventQueuePanel {...props.data} />
            case PanelType.userAndChannel:
                return <UserAndChannelPanel {...props.data} />
            case PanelType.debug:
                return <DebugPanel {...props.data} />
        }
    })()}</PanelGroup>
}
