import { refresh } from './apps/OverlayApp'

function tryRefresh() {
    try {
        refresh()
    } catch (e) {
        console.error(e)
    }
}

setInterval(tryRefresh, 1000)
