import { LandingAppViewData, AccountType, MODULES, ModuleVersion } from 'shared'
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
        </> : <>
                <section>
                    <p>
                        The Heccin Cheers Bot is a streaming platform integration similar to Streamlabs that provides various functionality for your live broadcasts! Features include:
                        <ul>
                            {Object.values(MODULES).filter(m => m.version === ModuleVersion.beta || m.version === ModuleVersion.released).map(m => <li>{m.name}</li>)}
                            <li>And more to come!</li>
                        </ul>
                    </p>
                    <p>
                        All features are driven through a mobile-friendly web-based control panel you can customize for your needs. You can grant acess to your control panel to moderators and alt accounts to help manage your stream for you, or control it yourself from a PC or mobile device!
                    </p>
                    <p>
                        For a demonstration of features and help setting things up on your stream, check out this how-to video:
                        <iframe width="320" height="180" src="https://www.youtube.com/embed/7qQL3YtycBw" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    </p>
                </section>
            </>}
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
