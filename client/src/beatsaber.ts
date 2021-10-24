import * as React from 'react'
import { BeatsaberConfigData, BeatsaberStateData, BSDataPullerLiveData, BSDataPullerLiveDataSuffix, BSDataPullerMapData, BSDataPullerMapDataSuffix } from 'shared'
import { BufferedWebsocket } from './utils'

export function useBeatsaberConnection(props: { config: BeatsaberConfigData, state: BeatsaberStateData }) {
    const [mapConnected, setMapConnected] = React.useState(false)
    const [liveConnected, setLiveConnected] = React.useState(false)
    const [mapData, setMapData] = React.useState<BSDataPullerMapData | null>(null)
    const [liveData, setLiveData] = React.useState<BSDataPullerLiveData | null>(null)

    const mapDataWS = React.useMemo(() => {
        const ws = new BufferedWebsocket(`ws://${props.config.apiHost}:${props.config.apiPort}${BSDataPullerMapDataSuffix}`)
        ws.addEventListener('open', () => setMapConnected(true))
        ws.addEventListener('close', () => setMapConnected(false))
        ws.addEventListener('message', e => setMapData(JSON.parse(e.data)))
        return ws
    }, [])

    const liveDataWS = React.useMemo(() => {
        const ws = new BufferedWebsocket(`ws://${props.config.apiHost}:${props.config.apiPort}${BSDataPullerMapDataSuffix}`)
        ws.addEventListener('open', () => setLiveConnected(true))
        ws.addEventListener('close', () => setLiveConnected(false))
        ws.addEventListener('message', e => setLiveData(JSON.parse(e.data)))
        return ws
    }, [])

    React.useEffect(() => {
        mapDataWS.url = `ws://${props.config.apiHost}:${props.config.apiPort}${BSDataPullerMapDataSuffix}`
        liveDataWS.url = `ws://${props.config.apiHost}:${props.config.apiPort}${BSDataPullerLiveDataSuffix}`

    }, [mapDataWS, liveDataWS, props.config.apiHost, props.config.apiPort])

    return { mapConnected, liveConnected, mapData, liveData }
}
