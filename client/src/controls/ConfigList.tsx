import React from 'react'
import { PanelViewDataProps, Props, TriggerConfig } from 'shared'
import { Alert } from './Alert'
import { ConfigAddField } from './ConfigAddField'
import { ConfigMockField } from './ConfigMockField'
import { ConfigRemoveField } from './ConfigRemoveField'
import { ConfigTriggerField } from './ConfigTriggerField'
import { Expander } from './Expander'
import { Fold } from './Fold'
import { PanelField } from './PanelField'
import { Toggle } from './Toggle'

export function ConfigList<T extends TriggerConfig>({ configs, configType, children, panelData, addAction, editAction, deleteAction, mockAction, label }: { configs: T[], configType: string, children: (config: T) => React.ReactNode, panelData: PanelViewDataProps, addAction: Props<typeof ConfigAddField>['action'], editAction: Props<typeof ConfigTriggerField>['action'], deleteAction: Props<typeof ConfigRemoveField>['deleteAction'], mockAction: Props<typeof ConfigMockField>['action'] | null, label?: string }) {
    const [tested, setTested] = React.useState('')
    const [includeArchived, setIncludeArchived] = React.useState(false)
    return <>
        {label ? <PanelField label={label}><div></div></PanelField> : null}
        <PanelField>
            <Toggle value={includeArchived} onToggle={setIncludeArchived} />&nbsp;Include archived {configType}s
        </PanelField>
        <PanelField>
            <div className="QueuedItemList">
                {configs.filter(c => includeArchived || !c.archived).map(c => <div key={c.id} className="QueuedItem">
                    {c.archived ? <PanelField>
                        <Alert type="warn">This {configType} is archived and won't be triggered.</Alert>
                    </PanelField> : null}
                    <ConfigTriggerField config={c} configType={configType} action={editAction} />
                    {(panelData.panel.items?.[c.id] ?? true) ? <>
                        {children(c)}
                        {mockAction ? <ConfigMockField config={c} configType={configType} action={mockAction} tested={tested} setTested={setTested} /> : null}
                        <ConfigRemoveField config={c} configType={configType} editAction={editAction} deleteAction={deleteAction} />
                    </> : <Fold />}
                    <Expander open={panelData.panel.items?.[c.id] ?? true} onToggle={open => panelData.onToggleItem(c.id, open)} />
                </div>)}
            </div>
        </PanelField>
        <ConfigAddField configType={configType} action={addAction} />
    </>
}
