import * as React from 'react'
import { ControlPanelAppViewData, ControlPanelPage, ModuleDataType, PanelViewDataProps } from 'shared'
import { PanelField } from '../controls/PanelField'
import { channelAction } from '../utils'
import { Button } from '../controls/Button'
import { Toggle } from '../controls/Toggle'
import { ExternalIconPicker } from '../controls/ExternalIconPicker'

export function WinLossPanel(props: ControlPanelAppViewData & ModuleDataType<'winLoss'> & PanelViewDataProps) {
    const setDisplayed = async (display: boolean) => await channelAction('winloss/set-displayed', { display })
    const adjustWins = async (delta: number) => await channelAction('winloss/adjust-wins', { delta })
    const adjustLosses = async (delta: number) => await channelAction('winloss/adjust-losses', { delta })
    const adjustDraws = async (delta: number) => await channelAction('winloss/adjust-draws', { delta })
    const adjustDeaths = async (delta: number) => await channelAction('winloss/adjust-deaths', { delta })
    const clear = async () => await channelAction('winloss/clear', {})

    const commandPrefix = props.modules.channelInfo.config.commandPrefix

    switch (props.page) {
        case ControlPanelPage.view:
            return <>
                <PanelField label="Display">
                    <Toggle value={props.state.display} onToggle={v => setDisplayed(v)} />
                </PanelField>
                <PanelField label={`Wins (${commandPrefix}win+1)`}>
                    <input type="number" disabled value={props.state.wins} />&nbsp;
                    <Button onClick={e => adjustWins(+1)}>+1</Button>&nbsp;
                    <Button onClick={e => adjustWins(-1)}>-1</Button>
                </PanelField>
                <PanelField label={`Losses (${commandPrefix}loss+1)`}>
                    <input type="number" disabled value={props.state.losses} />&nbsp;
                    <Button onClick={e => adjustLosses(+1)}>+1</Button>&nbsp;
                    <Button onClick={e => adjustLosses(-1)}>-1</Button>
                </PanelField>
                <PanelField label={`Draws (${commandPrefix}draw+1)`}>
                    <input type="number" disabled value={props.state.draws} />&nbsp;
                    <Button onClick={e => adjustDraws(+1)}>+1</Button>&nbsp;
                    <Button onClick={e => adjustDraws(-1)}>-1</Button>
                </PanelField>
                <PanelField label={`Deaths (${commandPrefix}death+1)`}>
                    <input type="number" disabled value={props.state.deaths} />&nbsp;
                    <Button onClick={e => adjustDeaths(+1)}>+1</Button>&nbsp;
                    <Button onClick={e => adjustDeaths(-1)}>-1</Button>
                </PanelField>
                <PanelField>
                    <Button onClick={e => clear()}>Reset all values to zero ({commandPrefix}reset)</Button>
                </PanelField>
            </>
        case ControlPanelPage.edit:
            return <>
                <hr />
                <PanelField label="Winning Emote" help="The emote displayed in the overlay when you have more wins than losses.">
                    <ExternalIconPicker selected={props.config.winningEmote} onSelect={v => channelAction('winloss/set-config', { winningEmote: v })} />
                </PanelField>
                <PanelField label="Losing Emote" help="The emote displayed in the overlay when you have more losses than wins.">
                    <ExternalIconPicker selected={props.config.losingEmote} onSelect={v => channelAction('winloss/set-config', { losingEmote: v })} />
                </PanelField>
                <PanelField label="Tied Emote" help="The emote displayed in the overlay when you have the same number of wins and losses.">
                    <ExternalIconPicker selected={props.config.tiedEmote} onSelect={v => channelAction('winloss/set-config', { tiedEmote: v })} />
                </PanelField>
                <PanelField label="Death Emote" help="The emote displayed in the overlay when your death counter increases.">
                    <ExternalIconPicker selected={props.config.deathEmote} onSelect={v => channelAction('winloss/set-config', { deathEmote: v })} />
                </PanelField>
                <PanelField label="Death Duration" help="The number of seconds that the death counter will remain on screen for. Remains on screen at all times if set to 0.">
                    <input type="number" step="any" defaultValue={props.config.deathDuration} onChange={e => channelAction('winloss/set-config', { deathDuration: parseInt(e.target.value) })} />&nbsp;seconds
                </PanelField>
            </>
        default:
            return <></>
    }
}
