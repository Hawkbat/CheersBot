import React from 'react'
import { BaseItemConfig, ChannelActions } from 'shared'
import { channelAction } from '../utils'
import { Button } from './Button'
import { PanelField } from './PanelField'

type ValidActionKey = { [P in keyof ChannelActions]: ReturnType<ChannelActions[P]> extends BaseItemConfig ? P : never }[keyof ChannelActions]

export function ConfigAddField({ configType, action }: { configType: string, action: ValidActionKey }) {
    return <>
        <PanelField>
            <Button primary onClick={() => channelAction(action, {})}>Add new {configType}</Button>
        </PanelField>
    </>
}