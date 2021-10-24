import * as React from 'react'
import { classes } from '../utils'
import { Alert } from './Alert'
import { PanelField } from './PanelField'

export function VTubeStudioIndicator(props: { type: 'overlay' | 'control-panel', processing: boolean, connected: boolean, apiError: string, readyState: number | undefined }) {
    return <>
        <div className={classes('VTubeStudioIndicator', { connected: props.connected })}>VTube Studio</div>
        {props.connected ? <PanelField>
            {props.type === 'control-panel' ?
                props.processing ?
                    <Alert type="success">The control panel is connected to VTube Studio! Configured redeems will trigger and lists will be populated based on the currently loaded model.</Alert> :
                    <Alert type="success">The control panel is connected to VTube Studio! Lists will be populated based on the currently loaded model.</Alert> :
                <Alert type="success">The overlay is connected to VTube Studio! Configured redeems will trigger based on the currently loaded model.</Alert>
            }
        </PanelField> : null}
        {!props.connected ? <PanelField>
            {props.type === 'control-panel' ?
                <Alert type="warn" tooltip={`Connection status: ${['Connecting', 'Connected', 'Disconnecting', 'Disconnected'][props.readyState ?? 3]}`}>Not connected to VTube Studio. Model, hotkey, and artmesh lists will not populate until the connection is reestablished.</Alert> :
                <Alert type="warn">The overlay is not connected to VTube Studio. Redeems will not work until the connection is reestablished. Make sure both OBS and VTube Studio are running and that the plugin API is enabled.</Alert>
            }
        </PanelField> : null}
        {props.apiError ? <PanelField>
            <Alert type="fail" tooltip={props.apiError}>An error occurred while communicating with VTube Studio.</Alert>
        </PanelField> : null}
    </>
}
