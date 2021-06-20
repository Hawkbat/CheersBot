import * as React from 'react'
import { ControlPanelAppViewData, PanelViewData, ControlPanelPage, getModule, VERSION_TOOLTIPS, PanelViewDataProps } from 'shared'
import { HeadpatsPanel } from '../panels/HeadpatsPanel'
import { ModeQueuePanel } from '../panels/ModeQueuePanel'
import { ChannelInfoPanel } from '../panels/ChannelInfoPanel'
import { DebugPanel } from '../panels/DebugPanel'
import { EvilDmPanel } from '../panels/EvilDmPanel'
import { UserQueuePanel } from '../panels/UserQueuePanel'
import { WinLossPanel } from '../panels/WinLossPanel'
import { VodQueuePanel } from '../panels/VodQueuePanel'
import { CustomMessagePanel } from '../panels/CustomMessagePanel'
import { CountersPanel } from '../panels/CountersPanel'
import { channelAction } from '../utils'
import { PanelGroup } from './PanelGroup'
import { PanelField } from './PanelField'
import { Toggle } from './Toggle'
import { Info } from './Info'
import { SoundsPanel } from '../panels/SoundsPanel'

export function Panel(props: { page: ControlPanelPage, panel: PanelViewData, data: ControlPanelAppViewData, onToggle: (open: boolean) => void, onToggleItem: (id: string, open: boolean) => void }) {
    const module = getModule(props.panel.type)
    const panelProps: PanelViewDataProps = { page: props.page, panel: props.panel, onToggleItem: props.onToggleItem }
    return <PanelGroup open={props.panel.open} onToggle={open => props.onToggle(open)} label={module.name}>
        {props.page === ControlPanelPage.edit
            ? <>
                <PanelField><span>{module.version ? <><Info text={module.version} tooltip={VERSION_TOOLTIPS[module.version]} />&nbsp;</> : <></>}{module.description}</span></PanelField>
                <hr />
                <PanelField label="Enabled"><Toggle value={module.getData(props.data.modules).config.enabled} onToggle={async v => await channelAction('config/enable-module', { type: props.panel.type, enabled: v })} /></PanelField>
            </>
            : <></>}
        {(() => {
            if (props.page === ControlPanelPage.edit && !module.getData(props.data.modules).config.enabled) return <></>
            switch (props.panel.type) {
                case 'headpats':
                    return <HeadpatsPanel {...panelProps} {...props.data} {...getModule(props.panel.type).getData(props.data.modules)} />
                case 'evilDm':
                    return <EvilDmPanel {...panelProps} {...props.data} {...getModule(props.panel.type).getData(props.data.modules)} />
                case 'modeQueue':
                    return <ModeQueuePanel {...panelProps} {...props.data} {...getModule(props.panel.type).getData(props.data.modules)} />
                case 'winLoss':
                    return <WinLossPanel {...panelProps} {...props.data} {...getModule(props.panel.type).getData(props.data.modules)} />
                case 'userQueue':
                    return <UserQueuePanel {...panelProps} {...props.data} {...getModule(props.panel.type).getData(props.data.modules)} />
                case 'vodQueue':
                    return <VodQueuePanel {...panelProps} {...props.data} {...getModule(props.panel.type).getData(props.data.modules)} />
                case 'customMessage':
                    return <CustomMessagePanel {...panelProps} {...props.data} {...getModule(props.panel.type).getData(props.data.modules)} />
                case 'counters':
                    return <CountersPanel {...panelProps} {...props.data} {...getModule(props.panel.type).getData(props.data.modules)} />
                case 'sounds':
                    return <SoundsPanel {...panelProps} {...props.data} {...getModule(props.panel.type).getData(props.data.modules)} />
                case 'channelInfo':
                    return <ChannelInfoPanel {...panelProps} {...props.data} {...getModule(props.panel.type).getData(props.data.modules)} />
                case 'debug':
                    return <DebugPanel {...panelProps} {...props.data} {...getModule(props.panel.type).getData(props.data.modules)} />
            }
        })()}
    </PanelGroup>
}
