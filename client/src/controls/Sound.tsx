import * as React from 'react'

export function Sound({ url, volume, onEnd }: { url: string, volume: number, onEnd: () => void }) {
    React.useEffect(() => {
        const audio = new Audio(url)
        audio.loop = false
        audio.volume = volume
        audio.addEventListener('ended', onEnd)
        audio.addEventListener('loadeddata', () => audio.play())
    }, [url, volume])
    return <></>
}
