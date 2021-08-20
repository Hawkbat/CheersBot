import { LandingAppViewData, AccountType, MODULES, ModuleVersion, logError, popLogBuffer } from 'shared'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { globalAction, globalView, useRepeatingEffect } from '../utils'
import { PanelGroup } from '../controls/PanelGroup'
import { PanelField } from '../controls/PanelField'
import { Button } from '../controls/Button'
import { AccessPanel } from '../panels/AccessPanel'
import { Changelog } from '../controls/Changelog'

let cachedData: LandingAppViewData | undefined
let pendingViewPromise: Promise<LandingAppViewData | undefined> | undefined

let debounce = false
export async function refresh(reloadData: boolean) {
    if (debounce) return
    debounce = true
    try {
        const data = reloadData || !cachedData ? await (pendingViewPromise ?? (pendingViewPromise = globalView('landing-app'))) : cachedData
        pendingViewPromise = undefined
        if (data) {
            cachedData = data
            if (reloadData && data.refreshTime !== REFRESH_TIME) location.reload()
            ReactDOM.render(<LandingApp {...data} />, document.getElementById('app'))
        }
    } catch (e) {
        logError('global', 'landing', 'Error refreshing landing page', e)
    }
    debounce = false
}

export function LandingApp(props: LandingAppViewData) {

    React.useEffect(() => {
        window.addEventListener('error', e => logError('global', 'landing', e.message, e.filename, e.lineno, e.colno, e.error))
    }, [])

    useRepeatingEffect(React.useCallback(async () => {
        await globalAction('debug/send-logs', { logs: popLogBuffer() })
    }, []), 60 * 1000, false)

    return <div className="Landing">
        <Changelog changelog={props.changelog.changelog} />
        {props.userChannelAccess ? <>
            <div className="draggable">
                <PanelGroup label="Your Control Panels">
                    <PanelField>Select a channel from the list below to access the corresponding control panel!</PanelField>
                    <PanelField>
                        <div className="list">
                            {props.channels.sort((a, b) => a.localeCompare(b)).map(c => <Button key={c} href={`/${c}/`}>{c}</Button>)}
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
            <AccessPanel userType={AccountType.user} targetType={AccountType.channel} access={props.userChannelAccess} />
        </> : <>
            <div className="Cheersy" />
            <section>
                <p>
                    The Heccin Cheers Bot is a streaming platform integration similar to Streamlabs that provides various functionality for your live broadcasts! Features include:
                </p>
                <ul>
                    {Object.values(MODULES).filter(m => m.version === ModuleVersion.beta || m.version === ModuleVersion.preRelease || m.version === ModuleVersion.released).map((m, i) => <li key={i}>{m.name}</li>)}
                    <li>And more to come!</li>
                </ul>
                <p>
                    All features are driven through a mobile-friendly web-based control panel you can customize for your needs. You can grant acess to your control panel to moderators and alt accounts to help manage your stream for you, or control it yourself from a PC or mobile device!
                    </p>
                <p>
                    For a demonstration of features and help setting things up on your stream, check out this how-to video:
                        <iframe width="320" height="180" src="https://www.youtube.com/embed/7qQL3YtycBw" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </p>
            </section>
        </>}
        {props.botChannelAccess ? <>
            <AccessPanel userType={AccountType.bot} targetType={AccountType.channel} access={props.botChannelAccess} />
        </> : null}
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
        <div className="draggable">
            <PanelGroup label="Live Streams">
                <PanelField>Cheers Bot users currently live on Twitch:</PanelField>
                {props.streams.sort((a, b) => a.viewCount - b.viewCount).map(s => <PanelField key={s.channel} label={s.channel}>
                    <a href={`https://twitch.tv/${s.channel}`}>Streaming {s.game} for {s.viewCount} viewers</a>
                </PanelField>)}
            </PanelGroup>
        </div>
        <div className="draggable">
            <PanelGroup label="Support Me">
                <PanelField>The Cheers Bot is currently free for all users, but it does cost money to rent the servers that it runs on. If you want to help financially support the Cheers Bot and ongoing feature development, consider leaving a tip for its creator, Hawkbar:</PanelField>
                <PanelField><a href="https://streamlabs.com/hawkbar/tip">https://streamlabs.com/hawkbar/tip</a></PanelField>
            </PanelGroup>
        </div>
    </div>
}
