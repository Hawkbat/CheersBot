import * as React from 'react'
import { useCallback, useEffect } from 'react'
import { TtsMessage } from 'shared'
import { channelAction, waitUntil } from '../utils'
import * as Tone from 'tone'


export function TextToSpeech({ msg, onEnd }: { msg: TtsMessage, onEnd: (msg: TtsMessage) => void }) {
    const { text, voice, style, pitch } = msg
    const effect = useCallback(async () => {
        await Tone.start()
        const encodedBuffer = await channelAction('tts/speak', { text, voice, style, pitch })
        if (!encodedBuffer) {
            onEnd(msg)
            return
        }
        const buffer = Uint8Array.from(atob(encodedBuffer), c => c.charCodeAt(0))
        const audioBuffer = await Tone.context.decodeAudioData(buffer.buffer)

        const roboPitchShift = new Tone.PitchShift(0.5).connect(Tone.Destination)
        roboPitchShift.wet.value = 0.5

        const pitchShift = new Tone.PitchShift(msg.pitch).connect(roboPitchShift)

        const reverb = new Tone.Reverb(1).connect(pitchShift)
        await reverb.ready
        reverb.wet.value = 0.25

        const player = new Tone.Player(audioBuffer).connect(reverb)

        const oldOnStop = player.onstop
        player.onstop = src => {
            oldOnStop(src)
            player.dispose()
            reverb.dispose()
            pitchShift.dispose()
            roboPitchShift.dispose()
            onEnd(msg)
        }

        await waitUntil(() => player.loaded)
        player.start()

    }, [text, voice, style, onEnd])

    useEffect(() => {
        effect()
    }, [effect])

    return <>{`${voice} (${style}): ${text}`}</>
}
