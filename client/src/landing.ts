
import { refresh } from './apps/LandingApp'

function tryRefresh() {
    try {
        refresh()
    } catch (e) {
        console.error(e)
    }
}

setInterval(tryRefresh, 10000)
tryRefresh()
