import { Icon, IconMap } from 'shared'
import * as React from 'react'
import { channelAction } from '../utils'
import { useCallback, useEffect, useState } from 'react'
import { ExternalIconButton } from './ExternalIconButton'
import { PanelField } from './PanelField'
import { Button } from './Button'

let runningPromise: Promise<IconMap | undefined> | null = null

function ExternalIconWindow(props: { icons: IconMap | null, onSelect: (icon: Icon | null | undefined) => void, onForceReload: () => void }) {
    const [search, setSearch] = useState('')

    const stopBubble = (e: React.SyntheticEvent) => e.stopPropagation()

    return <div className='ModalOverlay' onClick={() => props.onSelect(undefined)}>
        <div className='Modal ExternalIconWindow' onClick={stopBubble}>
            <PanelField label="Search">
                <input type="text" defaultValue={search} onChange={e => setSearch(e.target.value)} />
            </PanelField>
            {props.icons ? Object.keys(props.icons).filter(k => props.icons?.[k].some(i => i.name.toLowerCase().includes(search.toLowerCase()))).map(k => <div className='ExternalIconGroup' key={k}>
                <b>{k}</b>
                {props.icons ? props.icons[k].filter(i => i.name.toLowerCase().includes(search.toLowerCase())).map(icon => <ExternalIconButton icon={icon} key={`${icon.id} ${icon.name}`} size={1} onClick={() => props.onSelect(icon)} />) : <></>}
            </div>) : <></>}
            <PanelField>
                <Button onClick={props.onForceReload}>Force reload of emote list</Button>
            </PanelField>
        </div>
    </div>
}

const defaultIcon: Icon = { type: 'logo', id: 'hawkbar', name: 'Hawkbar' }

export function ExternalIconPicker(props: { selected: Icon | null, onSelect: (icon: Icon | null) => void }) {
    const [open, setOpen] = useState(false)
    const [forceReload, setForceReload] = useState(false)
    const [iconOptions, setIconOptions] = useState<IconMap | null>(null)

    const doFetch = useCallback(async (token: { canceled: boolean }) => {
        runningPromise = runningPromise ?? channelAction('channelinfo/get-icons', { forceReload })
        const results = await runningPromise
        if (token.canceled) return
        setIconOptions(results ?? null)
        setForceReload(false)
    }, [forceReload])

    useEffect(() => {
        const token = { canceled: false }
        doFetch(token)
        return () => {
            token.canceled = true
        }
    }, [doFetch])

    const onForceReload = () => {
        runningPromise = null
        setForceReload(true)
    }

    return <>
        <ExternalIconButton icon={props.selected ?? defaultIcon} size={1} onClick={() => setOpen(!open)} />
        {open && iconOptions ? <ExternalIconWindow icons={iconOptions} onSelect={icon => {
            if (icon !== undefined) props.onSelect(icon)
            setOpen(false)
        }} onForceReload={onForceReload} /> : <></>}
    </>
}
