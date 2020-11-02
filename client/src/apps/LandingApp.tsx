import { LandingAppViewData, AccountType } from 'shared'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { globalView } from '../utils'
import { PanelGroup } from '../controls/PanelGroup'
import { PanelField } from '../controls/PanelField'
import { Button } from '../controls/Button'
import { AccessPanel } from '../panels/AccessPanel'
import { Changelog } from '../controls/Changelog'

declare const REFRESH_TIME: number

let debounce = false
export async function refresh() {
    if (debounce) return
    debounce = true
    try {
        const data = await globalView('landing-app')
        if (data) {
            if (data.refreshTime !== REFRESH_TIME) location.reload()
            ReactDOM.render(<LandingApp {...data} />, document.getElementById('app'))
        }
    } catch (e) {
        console.error(e)
    }
    debounce = false
}

export function LandingApp(props: LandingAppViewData) {
    return <div className="Landing">
        <Changelog changelog={props.changelog.changelog} />
        {props.userData ? <>
            <div className="draggable">
                <PanelGroup label="Your Control Panels">
                    <PanelField>Select a channel from the list below to access the corresponding control panel!</PanelField>
                    <PanelField>
                        <div className="list">
                            {Object.keys(props.userData.channels).map(c => <React.Fragment key={c}><Button href={`/${c}/`}>{c}</Button>&nbsp;</React.Fragment>)}
                        </div>
                    </PanelField>
                    <hr />
                    <PanelField>If you don't see your channel in the list, you may need to be given access! The Cheers Bot works on a two-way approval system, where both the channel account and user account need to grant access to each other. Message Hawkbar for help!</PanelField>
                    <hr />
                    <PanelField>
                        <Button href="/logout">Log out of Cheers Bot</Button>
                    </PanelField>
                </PanelGroup>
            </div>
            <AccessPanel type={AccountType.channel} data={props.userData} />
        </> : <></>}
        <div className="draggable">
            <PanelGroup label="Log In or Register">
                <PanelField>To connect as a user account in order to access the control panel of your channel, or channels you moderate:</PanelField>
                <PanelField>
                    <Button primary href="/authorize/user/">Connect User Account</Button>
                </PanelField>
                <hr />
                <PanelField>To connect your account as a channel and get a custom overlay and control panel:</PanelField>
                <PanelField>
                    <Button href="/authorize/channel/">Connect Channel Account</Button>
                </PanelField>
                <hr />
                <PanelField>To connect your account as a "bot" user that can send chat messages to other channels:</PanelField>
                <PanelField>
                    <Button href="/authorize/bot/">Connect Bot Account</Button>
                </PanelField>
            </PanelGroup>
        </div>
    </div>
}
