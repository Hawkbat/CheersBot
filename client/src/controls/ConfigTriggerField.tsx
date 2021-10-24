import React from 'react'
import { ChannelActions, Props, safeParseInt, TriggerConfig } from 'shared'
import { channelAction } from '../utils'
import { Dropdown, DropdownOption } from './Dropdown'
import { PanelField } from './PanelField'
import { TwitchRewardDropdown } from './TwitchRewardDropdown'

type ValidActionKey = { [P in keyof ChannelActions]: Props<ChannelActions[P]> extends { id: string, redeemID?: string, redeemName?: string } ? P : never }[keyof ChannelActions]

export function ConfigTriggerField({ config, configType, action }: { config: TriggerConfig, configType: string, action: ValidActionKey }) {

    const triggerTypeLabels: Record<Exclude<TriggerConfig['triggerType'], undefined>, string> = {
        sub: 'Subscriptions',
        bits: 'Bits',
        reward: 'Channel Points',
    }

    const triggerTypeOptions: DropdownOption[] = Object.entries(triggerTypeLabels).map(([value, text]) => ({ value, text }))

    return <>
        <PanelField label="Trigger Type" help={`The type of event in Twitch that will trigger this ${configType}.`}>
            <Dropdown selected={config.triggerType ?? 'reward'} options={triggerTypeOptions} onSelect={v => channelAction(action, { id: config.id, triggerType: v })} />
        </PanelField>
        {config.triggerType === 'bits' ? <>
            <PanelField label="Amount" help={`The exact amount of bits needed to trigger this ${configType}. Leave blank for any number of bits.`}>
                <input type="number" value={config.triggerType} onChange={e => channelAction(action, { id: config.id, triggerAmount: safeParseInt(e.target.value) ?? undefined })} />&nbsp;bits
            </PanelField>
        </> : null}
        {(config.triggerType ?? 'reward') === 'reward' ? <>
            <PanelField label="Reward" help={`This is the channel point reward in Twitch that will trigger this ${configType}.`}>
                <TwitchRewardDropdown nullable selectedID={config.redeemID} selectedName={config.redeemName} onSelect={(id, name) => channelAction(action, { id: config.id, redeemID: id, redeemName: name })} />
            </PanelField>
        </> : null}
    </>
}
