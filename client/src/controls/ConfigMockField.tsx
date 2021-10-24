import React from 'react'
import { BaseItemConfig, ChannelActions, Props } from 'shared'
import { channelAction } from '../utils'
import { Button } from './Button'
import { PanelField } from './PanelField'

type ValidActionKey = { [P in keyof ChannelActions]: { id: string } extends Props<ChannelActions[P]> ? P : never }[keyof ChannelActions]

export function ConfigMockField({ config, configType, action, tested, setTested }: { config: BaseItemConfig, configType: string, action: ValidActionKey, tested: string, setTested: (v: string) => void }) {
    return <>
        <PanelField>
            <Button primary onClick={() => {
                channelAction(action, { id: config.id })
                setTested(config.id)
            }}>Test {configType}</Button>
            {config.id === tested ? <>&nbsp;<span>Success! Check the main tab!</span></> : <></>}
        </PanelField>
    </>
}