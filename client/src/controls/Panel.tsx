import * as React from 'react'
import { ControlPanelViewData, PanelType, PanelViewData } from 'shared'
import { PanelGroup } from './PanelGroup'
import { HeadpatsPanel } from '../panels/HeadpatsPanel'
import { ModeQueuePanel } from '../panels/ModeQueuePanel'
import { UserAndChannelPanel } from '../panels/UserAndChannelPanel'
import { DebugPanel } from '../panels/DebugPanel'
import { EvilDmPanel } from '../panels/EvilDmPanel'
import { UserQueuePanel } from '../panels/UserQueuePanel'

export function Panel(props: { panel: PanelViewData, data: ControlPanelViewData, onToggle: (open: boolean) => void }) {
    return <PanelGroup open={props.panel.open} onToggle={open => props.onToggle(open)} label={props.panel.type}>{(() => {
        switch (props.panel.type) {
            case PanelType.headpats:
                return <HeadpatsPanel {...props.data} {...props.data.data.modules.headpats} />
            case PanelType.evilDM:
                return <EvilDmPanel {...props.data} {...props.data.data.modules.evilDm} />
            case PanelType.modeQueue:
                return <ModeQueuePanel {...props.data} {...props.data.data.modules.modeQueue} />
            case PanelType.userQueue:
                return <UserQueuePanel {...props.data} {...props.data.data.modules.userQueue} />
            case PanelType.userAndChannel:
                return <UserAndChannelPanel {...props.data} />
            case PanelType.debug:
                return <DebugPanel {...props.data} {...props.data.data.modules.debug} />
        }
    })()}</PanelGroup>
}
