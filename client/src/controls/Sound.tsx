import * as React from 'react'

export function Sound({ url, volume, onEnd }: { url: string, volume: number, onEnd: () => void }) {
    const ref = React.useRef<HTMLAudioElement | null>(null)
    React.useLayoutEffect(() => {
        if (ref.current) {
            ref.current.volume = volume
            ref.current.addEventListener('ended', onEnd)
            ref.current.play()
        }
    }, [])
    return <audio ref={ref} src={url} />
}
