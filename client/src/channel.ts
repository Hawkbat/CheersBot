import { refresh } from './apps/ControlPanelApp'

function tryRefresh() {
    try {
        refresh()
    } catch (e) {
        console.error(e)
    }
}

setInterval(tryRefresh, 1000)
tryRefresh()
