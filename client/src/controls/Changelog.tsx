import * as React from 'react'
import { Changelog } from 'shared'
import { classes } from '../utils'
import { Icon } from './Icon'

const LOCALSTORAGE_KEY = 'cheersbot-changelog-date'

function parseDate(s: string): Date {
    const bits = s.split('-')
    const year = parseInt(bits[0])
    const month = parseInt(bits[1]) - 1
    const day = parseInt(bits[2])
    return new Date(year, month, day)
}

const lastVersionDate = parseDate(localStorage.getItem(LOCALSTORAGE_KEY) ?? '1970-01-01')

export function Changelog(props: Changelog) {
    const latestVersion = props.changelog[props.changelog.length - 1]
    const latestVersionDate = parseDate(latestVersion.released)
    const [visible, setVisible] = React.useState(lastVersionDate < latestVersionDate)

    const onOpen = () => {
        setVisible(true)
    }

    const onClose = () => {
        localStorage.setItem(LOCALSTORAGE_KEY, latestVersion.released)
        setVisible(false)
    }

    const stopBubble = (e: React.SyntheticEvent) => e.stopPropagation()

    return <>
        <div className="ChangelogOpener" onClick={onOpen}>
            <Icon icon="sparkles" />&nbsp;
            <span>What's New</span>
        </div>
        {visible ? <div className="ModalOverlay" onClick={onClose}>
            <div className="Modal Changelog" onClick={stopBubble}>
                <h1>What's New</h1>
                <span className="ModalCloser" onClick={onClose}><Icon icon="times" fixedWidth /></span>
                <aside>If you encounter any issues with the new release, or have any questions about new features, please message <a href="https://twitter.com/HawkbarGaming">Hawkbar</a>!</aside>
                {props.changelog.slice().reverse().map(v => <div className={classes("ChangelogVersion", { new: parseDate(v.released) > lastVersionDate })} key={v.version}>
                    <div><b>Version {v.version}</b></div>
                    <div>Released: {parseDate(v.released).toLocaleDateString()}</div>
                    <div>Changes:</div>
                    <ul>{v.changes.map((c, i) => <li key={i}>{c}</li>)}</ul>
                </div>)}
            </div>
        </div> : <></>}
    </>
}
