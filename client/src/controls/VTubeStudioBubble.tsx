import * as React from 'react'
import { Icon } from 'shared'
import { Bubble } from './Bubble'

export function VTubeStudioBubble(props: { connected: boolean, apiError: string, readyState: number | undefined }) {
    const icon: Icon = { type: 'logo', id: 'vts', name: 'VTube Studio' }
    return <>
        <Bubble icon={icon} username="VTubeStudio" msg={['connecting...', 'connected!', 'disconnecting...', 'disconnected.'][props.readyState ?? 3]} />
        {props.apiError !== null ?
            <Bubble icon={icon} username="Error" msg={props.apiError} /> :
            null}
    </>
}
