import { refresh } from './apps/OverlayApp'

setInterval(() => {
    try {
        refresh()
    } catch (e) {
        console.error(e)
    }
}, 1000)
