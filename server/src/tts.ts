import * as sdk from 'microsoft-cognitiveservices-speech-sdk'
import { TtsMessage } from 'shared'

export async function textToSpeech(msg: TtsMessage, azureSubKey: string, azureRegion: string) {
    const speechConfig = sdk.SpeechConfig.fromSubscription(azureSubKey, azureRegion)
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig)
    const buffer = await new Promise<ArrayBuffer>((res, rej) => {
        synthesizer.speakSsmlAsync(`<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US"><voice name="${msg.voice}"><mstts:express-as style="${msg.style}">${msg.text}</mstts:express-as></voice></speak>`, result => {
            if (result.errorDetails) {
                rej(result.errorDetails)
                synthesizer.close()
            } else {
                synthesizer.close()
                res(result.audioData)
            }
        }, error => {
            synthesizer.close()
            rej(error)
        })
    })
    return buffer
}
