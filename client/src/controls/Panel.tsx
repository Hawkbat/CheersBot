import * as React from 'react'
import { ControlPanelAppViewData, PanelViewData, ControlPanelPage, getModule, VERSION_TOOLTIPS } from 'shared'
import { HeadpatsPanel } from '../panels/HeadpatsPanel'
import { ModeQueuePanel } from '../panels/ModeQueuePanel'
import { ChannelInfoPanel } from '../panels/ChannelInfoPanel'
import { DebugPanel } from '../panels/DebugPanel'
import { EvilDmPanel } from '../panels/EvilDmPanel'
import { UserQueuePanel } from '../panels/UserQueuePanel'
import { WinLossPanel } from '../panels/WinLossPanel'
import { VodQueuePanel } from '../panels/VodQueuePanel'
import { CustomMessagePanel } from '../panels/CustomMessagePanel'
import { channelAction } from '../utils'
import { PanelGroup } from './PanelGroup'
import { PanelField } from './PanelField'
import { Toggle } from './Toggle'
import { Info } from './Info'

export function Panel(props: { page: ControlPanelPage, panel: PanelViewData, data: ControlPanelAppViewData, onToggle: (open: boolean) => void }) {
    const module = getModule(props.panel.type)
    return <PanelGroup open={props.panel.open} onToggle={open => props.onToggle(open)} label={module.name}>
        {props.page === ControlPanelPage.edit
            ? <>
                <PanelField><span>{module.version ? <><Info text={module.version} tooltip={VERSION_TOOLTIPS[module.version]} />&nbsp;</> : <></>}{module.description}</span></PanelField>
                <hr />
                <PanelField label="Enabled"><Toggle value={module.getData(props.data.channelData).config.enabled} onToggle={async v => await channelAction('config/enable-module', { type: props.panel.type, enabled: v })} /></PanelField>
            </>
            : <></>}
        {(() => {
            if (props.page === ControlPanelPage.edit && !module.getData(props.data.channelData).config.enabled) return <></>
            switch (props.panel.type) {
                case 'headpats':
                    return <HeadpatsPanel page={props.page} {...props.data} {...getModule(props.panel.type).getData(props.data.channelData)} />
                case 'evilDm':
                    return <EvilDmPanel page={props.page} {...props.data} {...getModule(props.panel.type).getData(props.data.channelData)} />
                case 'modeQueue':
                    return <ModeQueuePanel page={props.page} {...props.data} {...getModule(props.panel.type).getData(props.data.channelData)} />
                case 'winLoss':
                    return <WinLossPanel page={props.page} {...props.data} {...getModule(props.panel.type).getData(props.data.channelData)} />
                case 'userQueue':
                    return <UserQueuePanel page={props.page} {...props.data} {...getModule(props.panel.type).getData(props.data.channelData)} />
                case 'vodQueue':
                    return <VodQueuePanel page={props.page} {...props.data} {...getModule(props.panel.type).getData(props.data.channelData)} />
                case 'customMessage':
                    return <CustomMessagePanel page={props.page} {...props.data} {...getModule(props.panel.type).getData(props.data.channelData)} />
                case 'channelInfo':
                    return <ChannelInfoPanel page={props.page} {...props.data} {...getModule(props.panel.type).getData(props.data.channelData)} />
                case 'debug':
                    return <DebugPanel page={props.page} {...props.data} {...getModule(props.panel.type).getData(props.data.channelData)} />
            }
        })()}
    </PanelGroup>
}
