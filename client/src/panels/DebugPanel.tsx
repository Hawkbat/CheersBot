import * as React from 'react'
import { ControlPanelAppViewData, ControlPanelPage, generateID, logError, ModuleDataType, PanelViewDataProps, safeParseInt, TtsMessage } from 'shared'
import { PanelField } from '../controls/PanelField'
import { Button } from '../controls/Button'
import { channelAction } from '../utils'
import { TextToSpeech } from '../controls/TextToSpeech'
import { Toggle } from 'src/controls/Toggle'

export function DebugPanel(props: ControlPanelAppViewData & ModuleDataType<'debug'> & PanelViewDataProps) {
    const [ttsVoice, setTtsVoice] = React.useState('en-US-AriaNeural')
    const [ttsStyle, setTtsStyle] = React.useState('chat')
    const [ttsPitch, setTtsPitch] = React.useState(0)
    const [ttsText, setTtsText] = React.useState('Hello there! Have a great day.')
    const [ttsItems, setTtsItems] = React.useState<TtsMessage[]>([])

    const removeTtsMsg = React.useCallback(msg => {
        setTtsItems(items => items.filter(i => i !== msg))
    }, [])

    const reload = async () => {
        try {
            await channelAction('debug/reload', {})
        } catch (e) {
            logError(CHANNEL_NAME, 'debug', e)
        }
    }

    switch (props.page) {
        case ControlPanelPage.view:
            return <>
                <PanelField label="Overlay Logs" help="Shows the most recent log messages from the overlay window in the overlay.">
                    <Toggle value={props.config.overlayLogs} onToggle={v => channelAction('debug/set-config', { overlayLogs: v })} />
                </PanelField>
                <hr />

                <div className="QueuedItemList">
                    {props.state.logs.length
                        ? props.state.logs.map(s => <div key={s.join(' ')} className="QueuedItem">
                            <PanelField label={s[0]}>
                                {s.slice(1).join(' ')}
                            </PanelField>
                        </div>)
                        : <i>No logs available</i>
                    }
                </div>
                <hr />
                <PanelField label="TTS Voice">
                    <input type="text" value={ttsVoice} onChange={e => setTtsVoice(e.target.value)} />
                </PanelField>
                <PanelField label="TTS Style">
                    <input type="text" value={ttsStyle} onChange={e => setTtsStyle(e.target.value)} />
                </PanelField>
                <PanelField label="TTS Pitch Change">
                    <input type="number" value={ttsPitch} min={-12} max={12} step={1} onChange={e => setTtsPitch(safeParseInt(e.target.value) ?? ttsPitch)} />
                </PanelField>
                <PanelField label="TTS Text">
                    <input type="text" value={ttsText} onChange={e => setTtsText(e.target.value)} />
                </PanelField>
                <PanelField>
                    <Button primary onClick={e => {
                        setTtsItems([
                            ...ttsItems,
                            { id: generateID(), voice: ttsVoice, style: ttsStyle, text: ttsText, pitch: ttsPitch },
                        ])
                    }}>Send TTS</Button>
                </PanelField>
                {...ttsItems.map(i => <TextToSpeech key={i.id} msg={i} onEnd={removeTtsMsg} />)}
                <hr />
                <PanelField>
                    <Button onClick={e => reload()}>Force reload</Button>&nbsp;all control panels and overlays
                </PanelField>
            </>
        default:
            return <></>
    }
}
