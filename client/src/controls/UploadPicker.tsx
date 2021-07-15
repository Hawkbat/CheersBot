import * as React from 'react'
import { classes, useCallbackProgress } from '../utils'
import { useState } from 'react'
import { PanelField } from './PanelField'
import { Icon } from './Icon'

function UploadButton(props: { icon: string, name: string, selected?: boolean, ephemeral?: boolean, spinning?: boolean, onClick: () => unknown, onDelete?: () => unknown }) {
    const [onDelete, deleteInProgress] = useCallbackProgress(props.onDelete)

    return <div className={classes('UploadButton', { ephemeral: !!props.ephemeral, selected: !!props.selected })} onClick={props.onClick}>
        <div className="UploadButtonIcon">
            <Icon icon={props.icon} fixedWidth spin={props.spinning} />
        </div>
        <div className="UploadButtonLabel">{props.name}</div>
        {props.onDelete ? <div className="UploadButtonX" onClick={e => {
            e.stopPropagation()
            onDelete()
        }}>
            <Icon icon={deleteInProgress ? 'spinner' : 'times'} spin={deleteInProgress} fixedWidth />
        </div> : null}
    </div>
}

function UploadWindow(props: { icon: string, selected: string | null, files: string[], onSelect: (file: string | null | undefined) => unknown, onDelete?: (file: string) => unknown, onUpload?: (file: string, data: string) => unknown }) {
    const [search, setSearch] = useState('')
    const [onUpload, uploadInProgress] = useCallbackProgress(props.onUpload)

    const stopBubble = (e: React.SyntheticEvent) => e.stopPropagation()

    const doUpload = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.addEventListener('change', async e => {
            const file = input.files?.[0]
            if (file) {
                const buffer = await file.arrayBuffer()
                const base64 = btoa([...new Uint8Array(buffer)].map(b => String.fromCharCode(b)).join(''))
                await onUpload(file.name, base64)
                props.onSelect(file.name)
            }
        })
        input.click()
    }

    return <div className='ModalOverlay' onClick={() => props.onSelect(undefined)}>
        <div className='Modal UploadWindow' onClick={stopBubble}>
            <PanelField label="Search">
                <input type="text" defaultValue={search} onChange={e => setSearch(e.target.value)} />
            </PanelField>

            {props.files.filter(f => f.toLowerCase().includes(search.toLowerCase())).sort((a, b) => a.localeCompare(b)).map(f => <UploadButton key={f} icon={props.icon} name={f} onClick={() => props.onSelect(f)} onDelete={props.onDelete ? () => props.onDelete?.(f) : undefined} />)}

            {props.onUpload ? <UploadButton icon={uploadInProgress ? 'spinner' : 'plus'} name="Upload new file..." ephemeral spinning={uploadInProgress} onClick={() => doUpload()} /> : null}
        </div>
    </div>
}

export function UploadPicker(props: { icon: string, selected: string | null, files: string[], onSelect: (file: string | null) => unknown, onDelete?: (file: string) => unknown, onUpload?: (file: string, data: string) => unknown }) {
    const [open, setOpen] = useState(false)

    return <>
        <UploadButton icon={props.icon} name={props.selected ?? 'Select a file...'} ephemeral={!props.selected} onClick={() => setOpen(!open)} onDelete={props.selected ? () => props.onSelect(null) : undefined} />
        {open ? <UploadWindow icon={props.icon} selected={props.selected} files={props.files} onSelect={file => {
            if (file !== undefined) props.onSelect(file)
            setOpen(false)
        }} onDelete={props.onDelete} onUpload={props.onUpload} /> : null}
    </>
}
