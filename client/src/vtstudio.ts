import { vts } from 'shared'
import { BufferedWebsocket } from './utils'
import iconUri from './vts-plugin-icon.png'

const icon = iconUri.substr(iconUri.indexOf(',') + 1)

const TOKEN_KEY = 'cheers-bot-vtstudio-token'

export class VTSClient {
    plugin!: vts.Plugin
    ws: BufferedWebsocket

    constructor(websocketUrl: string = 'ws://localhost:8001') {
        this.ws = new BufferedWebsocket(websocketUrl)
        const handlers: vts.MessageHandler[] = []

        const bus: vts.MessageBus = {
            on: handler => handlers.push(handler),
            off: handler => handlers.splice(handlers.findIndex(h => h === handler), 1),
            send: msg => this.ws.send(JSON.stringify(msg)),
        }

        this.ws.addEventListener('message', e => {
            const msg = JSON.parse(e.data)
            for (const handler of [...handlers]) handler(msg)
        })

        const apiClient = new vts.ApiClient(bus)
        const initialToken = localStorage.getItem(TOKEN_KEY) ?? undefined
        this.plugin = new vts.Plugin(apiClient, 'Heccin Cheers Bot', 'Hawkbar', icon, initialToken, token => localStorage.setItem(TOKEN_KEY, token))
    }
}
