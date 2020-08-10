import { refresh } from './apps/ControlPanelApp'

setInterval(() => {
    try {
        refresh()
    } catch (e) {
        console.error(e)
    }
}, 1000)
