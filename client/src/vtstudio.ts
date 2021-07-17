import * as vts from 'vtubestudio'
import { BufferedWebsocket } from './utils'
import iconUri from './vts-plugin-icon.png'

const icon = iconUri.substr(iconUri.indexOf(',') + 1)

const TOKEN_KEY = 'cheers-bot-vtstudio-token'

export class VTSClient {
    plugin!: vts.Plugin
    ws: BufferedWebsocket

    constructor(websocketUrl: string = 'ws://localhost:8001') {
        this.ws = new BufferedWebsocket(websocketUrl)

        const bus = new vts.WebSocketBus(this.ws)
        const apiClient = new vts.ApiClient(bus)
        const initialToken = localStorage.getItem(TOKEN_KEY) ?? undefined
        this.plugin = new vts.Plugin(apiClient, 'Heccin Cheers Bot', 'Hawkbar', icon, initialToken, token => localStorage.setItem(TOKEN_KEY, token))
    }
}
