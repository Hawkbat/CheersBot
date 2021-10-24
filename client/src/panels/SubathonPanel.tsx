import * as React from 'react'
import { ControlPanelAppViewData, ControlPanelPage, logError, ModuleDataType, PanelViewDataProps, safeParseFloat, SubathonConfigData, SubathonTriggerConfig } from 'shared'
import { PanelField } from '../controls/PanelField'
import { Button } from '../controls/Button'
import { channelAction } from '../utils'
import { ExternalIconPicker } from '../controls/ExternalIconPicker'
import { TwitchRewardDropdown } from '../controls/TwitchRewardDropdown'
import { Expander } from '../controls/Expander'
import { Fold } from '../controls/Fold'
import { DurationInput } from 'src/controls/DurationInput'
import { Dropdown, DropdownOption } from 'src/controls/Dropdown'
import { Toggle } from 'src/controls/Toggle'

export function SubathonPanel(props: ControlPanelAppViewData & ModuleDataType<'subathon'> & PanelViewDataProps) {
    const [adjustTime, setAdjustTime] = React.useState(0)
    const [tested, setTested] = React.useState('')

    const mockEvent = async (triggerID: string) => {
        try {
            await channelAction('subathon/mock', { triggerID })
            setTested(triggerID)
        } catch (e) {
            logError(CHANNEL_NAME, 'subathon', e)
        }
    }

    const typeLabels: Record<SubathonConfigData['type'], string> = {
        extend: 'Extend Timer',
        reset: 'Reset Timer',
    }

    const typeOptions: DropdownOption[] = Object.entries(typeLabels).map(([value, text]) => ({ value, text }))

    const triggerTypeLabels: Record<SubathonTriggerConfig['type'], string> = {
        sub: 'Subscriptions',
        bits: 'Bits',
        reward: 'Channel Points',
    }

    const triggerTypeOptions: DropdownOption[] = Object.entries(triggerTypeLabels).map(([value, text]) => ({ value, text }))

    const timeInCurrentPeriod = Date.now() - (props.state.startTime ?? Date.now())
    const remainingTime = Math.max(0, props.state.remainingTime - timeInCurrentPeriod)
    const totalTimePassed = props.state.elapsedTime + timeInCurrentPeriod

    switch (props.page) {
        case ControlPanelPage.view:
            return <>
                <PanelField label="Activate" help="Activate or deactivate a subathon. This doesn't start the timer yet!">
                    <Toggle value={props.state.active} onToggle={active => channelAction('subathon/set-active', { active })} />
                </PanelField>
                {props.state.active ? <>
                    <PanelField label="Run Timer" help="Toggle whether the timer is running or not.">
                        <Toggle value={props.state.running} onToggle={v => channelAction(v ? 'subathon/start-timer' : 'subathon/stop-timer', {})} />
                    </PanelField>
                    <PanelField label="Time Remaining" help="The amount of time left in the subathon timer.">
                        <DurationInput disabled value={remainingTime} />
                    </PanelField>
                    <PanelField label="Adjust Time">
                        <DurationInput value={adjustTime} onChange={t => setAdjustTime(t)} />
                    </PanelField>
                    <PanelField label=" ">
                        <Button onClick={() => {
                            channelAction('subathon/add-time', { duration: adjustTime })
                            setAdjustTime(0)
                        }}>Add</Button>&nbsp;
                        <Button onClick={() => {
                            channelAction('subathon/remove-time', { duration: adjustTime })
                            setAdjustTime(0)
                        }}>Subtract</Button>&nbsp;
                        <Button onClick={() => {
                            channelAction('subathon/set-time', { duration: adjustTime })
                            setAdjustTime(0)
                        }}>Set</Button>
                    </PanelField>
                    <PanelField label=" ">
                        <Button primary onClick={() => channelAction('subathon/set-time', { duration: props.config.duration })}>Reset</Button>
                    </PanelField>
                    <PanelField label="Time Spent" help="The total amount of time that has passed while the subathon timer has been running.">
                        <DurationInput disabled value={totalTimePassed} />
                    </PanelField>
                    <PanelField label="Sub Count" help="The total number of subs contributed while the subathon timer has been running.">
                        <input disabled value={props.state.subCount} />&nbsp;subs
                    </PanelField>
                    <PanelField label="Bit Count" help="The total number of bits contributed while the subathon timer has been running.">
                        <input disabled value={props.state.bitCount} />&nbsp;bits
                    </PanelField>
                    <PanelField label="Point Count" help="The total number of channel points contributed while the subathon timer has been running.">
                        <input disabled value={props.state.pointCount} />&nbsp;channel points
                    </PanelField>
                </> : null}
            </>
        case ControlPanelPage.edit:
            return <>
                <hr />
                <PanelField label="Emote" help="The emote displayed in the overlay while the subathon is active.">
                    <ExternalIconPicker selected={props.config.icon} onSelect={icon => channelAction('subathon/set-config', { icon })} />
                </PanelField>
                <PanelField label="Start Text" help="The text displayed when the subathon is active but the subathon has not started.">
                    <input type="text" defaultValue={props.config.startText} onChange={e => channelAction('subathon/set-config', { startText: e.target.value })} />
                </PanelField>
                <PanelField label="Running Text" help={"The text displayed while the timer is running."}>
                    <input type="text" defaultValue={props.config.runningText} onChange={e => channelAction('subathon/set-config', { runningText: e.target.value })} />
                </PanelField>
                <PanelField label="End Text" help="The text displayed when the timer finishes but before the subathon has ended.">
                    <input type="text" defaultValue={props.config.endText} onChange={e => channelAction('subathon/set-config', { endText: e.target.value })} />
                </PanelField>
                <PanelField label="Timer Duration" help="The default amount of time that the subathon will start at.">
                    <DurationInput value={props.config.duration} onChange={duration => channelAction('subathon/set-config', { duration })} />
                </PanelField>
                <PanelField label="Type" help="How the timer behaves when users contribute to the subathon.">
                    <Dropdown selected={props.config.type} options={typeOptions} onSelect={v => channelAction('subathon/set-config', { type: v })} />
                </PanelField>
                <PanelField>
                    <div className="QueuedItemList">
                        {props.config.triggers.map(t => <div key={t.id} className="QueuedItem">
                            <PanelField label="Contrib. Type" help="The type of contribution that can be spent by users.">
                                <Dropdown nullable nullText="(Remove)" selected={t.type} options={triggerTypeOptions} onSelect={v => v ? channelAction('subathon/edit-trigger', { id: t.id, type: v }) : channelAction('subathon/delete-trigger', { id: t.id })} />
                            </PanelField>
                            {t.type === 'reward' ? <PanelField label="Reward" help="This is the channel point reward in Twitch that will contribute to the subathon.">
                                <TwitchRewardDropdown nullable selectedID={t.redeemID} selectedName={t.redeemName} onSelect={(id, name) => channelAction('subathon/edit-trigger', { id: t.id, redeemID: id, redeemName: name })} />
                            </PanelField> : null}
                            {(props.panel.items?.[t.id] ?? true) ? <>
                                {props.config.type === 'extend' ? <>
                                    <PanelField label="Base Duration" help="The amount of time that will always be added to the timer no matter how many subs/bits/channel points are given.">
                                        <DurationInput value={t.baseDuration} onChange={v => channelAction('subathon/edit-trigger', { id: t.id, baseDuration: v })} />
                                    </PanelField>
                                    {t.type === 'bits' || t.type === 'reward' ? <PanelField label="Scaled Duration" help="The amount of time that will be added to the subathon for each individual sub/bit/channel point given.">
                                        <DurationInput value={t.scaledDuration} onChange={v => channelAction('subathon/edit-trigger', { id: t.id, scaledDuration: v })} />
                                    </PanelField> : null}
                                </> : null}
                                <PanelField>
                                    <Button onClick={() => mockEvent(t.id)}>Test contribution</Button>
                                    {t.id === tested ? <>&nbsp;<span>Success! Check the main tab!</span></> : <></>}
                                </PanelField>
                            </> : <Fold />}
                            <Expander open={props.panel.items?.[t.id] ?? true} onToggle={open => props.onToggleItem(t.id, open)} />
                        </div>)}
                    </div>
                </PanelField>
                <PanelField>
                    <Button primary onClick={() => channelAction('subathon/add-trigger', {})}>Add new contribution type</Button>
                </PanelField>
            </>
        default:
            return <></>
    }
}
