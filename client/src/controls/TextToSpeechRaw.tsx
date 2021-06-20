import * as React from 'react'
import { useCallback, useEffect } from 'react'
import { TtsMessage } from 'shared'
import { channelAction } from '../utils'

let audioContext!: AudioContext

export function TextToSpeechRaw({ msg, onEnd }: { msg: TtsMessage, onEnd: (msg: TtsMessage) => void }) {
    const { text, voice, style, pitch } = msg
    const effect = useCallback(async (sourceNode: AudioBufferSourceNode, destination: AudioNode) => {
        const encodedBuffer = await channelAction('tts/speak', { text, voice, style, pitch })
        if (!encodedBuffer) {
            onEnd(msg)
            return
        }
        const buffer = Uint8Array.from(atob(encodedBuffer), c => c.charCodeAt(0))
        const audioBuffer = await audioContext.decodeAudioData(buffer.buffer)
        sourceNode.buffer = audioBuffer
        sourceNode.connect(destination)
        sourceNode.start(0)
        sourceNode.addEventListener('ended', () => onEnd(msg))
    }, [text, voice, style, onEnd])

    useEffect(() => {
        audioContext = audioContext ?? new AudioContext()
        const sourceNode = audioContext.createBufferSource()
        const gainNode = audioContext.createGain()
        gainNode.connect(audioContext.destination)
        effect(sourceNode, gainNode)
        return () => {
            sourceNode.stop()
            sourceNode.disconnect()
            gainNode.disconnect()
        }
    }, [effect])

    return <>{`${voice} (${style}): ${text}`}</>
}
