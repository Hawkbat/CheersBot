import React from 'react'
import { BaseItemConfig, ChannelActions, Props } from 'shared'
import { channelAction } from '../utils'
import { Button } from './Button'
import { PanelField } from './PanelField'

type ValidEditActionKey = { [P in keyof ChannelActions]: Props<ChannelActions[P]> extends { id: string, archived?: boolean } ? P : never }[keyof ChannelActions]

type ValidDeleteActionKey = { [P in keyof ChannelActions]: Props<ChannelActions[P]> extends { id: string } ? P : never }[keyof ChannelActions]

export function ConfigRemoveField({ config, configType, editAction, deleteAction }: { config: BaseItemConfig, configType: string, editAction: ValidEditActionKey, deleteAction: ValidDeleteActionKey }) {
    return <>
        <PanelField>
            <Button onClick={() => confirm(`Are you sure you want to ${config.archived ? 'restore' : 'remove'} this ${configType}? This is NOT permanent!`) && channelAction(editAction, { id: config.id, archived: !config.archived })}>{config.archived ? 'Restore' : 'Remove'} {configType}</Button>
            {config.archived ? <>
                &nbsp;or&nbsp;
                 <Button onClick={() => confirm(`Are you sure you want to delete this ${configType} permanently?`) && channelAction(deleteAction, { id: config.id })}>Delete {configType}</Button>
            </> : null}
        </PanelField>
    </>
}