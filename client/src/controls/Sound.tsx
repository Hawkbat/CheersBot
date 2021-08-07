import * as React from 'react'
import { randomItem, randomWeightedItem, SoundConfig } from 'shared'
import { playSound } from '../utils'

export function Sound({ baseUrl, config, onEnd }: { baseUrl: string, config: SoundConfig, onEnd: () => void }) {
    React.useEffect(() => {
        (async () => {
            if ((config.type ?? 'one') === 'one') {
                if (config.fileName) await playSound(baseUrl + config.fileName, config.volume)
            } else {
                const options = config.sounds ?? []
                const s = config.type === 'weighted-any' ?
                    randomWeightedItem(options, o => o.weight ?? 1) :
                    randomItem(options)
                if (s.fileName) await playSound(baseUrl + s.fileName, config.volume)
            }
            onEnd()
        })()
    }, [config.id])
    return <></>
}
