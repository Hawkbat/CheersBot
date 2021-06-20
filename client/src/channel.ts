import { refresh } from './apps/ControlPanelApp'
import { setRefreshCallback } from './utils'

setRefreshCallback(refresh, true)
