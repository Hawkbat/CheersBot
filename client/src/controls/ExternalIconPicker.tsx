import { Icon, IconMap } from 'shared'
import * as React from 'react'
import { channelAction } from '../utils'
import { useCallback, useEffect, useState } from 'react'
import { ExternalIconButton } from './ExternalIconButton'
import { PanelField } from './PanelField'

let runningPromise: Promise<IconMap | undefined> | null = null

function ExternalIconWindow(props: { icons: IconMap | null, onSelect: (icon: Icon | null | undefined) => void }) {
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
        </div>
    </div>
}

const defaultIcon: Icon = { type: 'logo', id: 'hawkbar', name: 'Hawkbar' }

export function ExternalIconPicker(props: { selected: Icon | null, onSelect: (icon: Icon | null) => void }) {
    const [open, setOpen] = useState(false)
    const [iconOptions, setIconOptions] = useState<IconMap | null>(null)

    const doFetch = useCallback(async () => {
        runningPromise = runningPromise ?? channelAction('channelinfo/get-icons', {})
        const results = await runningPromise
        setIconOptions(results ?? null)
    }, [])

    useEffect(() => {
        doFetch()
    }, [doFetch])

    return <>
        <ExternalIconButton icon={props.selected ?? defaultIcon} size={1} onClick={() => setOpen(!open)} />
        {open && iconOptions ? <ExternalIconWindow icons={iconOptions} onSelect={icon => {
            if (icon !== undefined) props.onSelect(icon)
            setOpen(false)
        }} /> : <></>}
    </>
}
