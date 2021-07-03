
import { vts } from 'shared'

const TOKEN_KEY = 'cheers-bot-vtstudio-token'

async function connect() {
    const ws = new WebSocket('ws://localhost:8001')

    const handlers: vts.MessageHandler[] = []

    const bus: vts.MessageBus = {
        on: handler => handlers.push(handler),
        off: handler => handlers.splice(handlers.findIndex(h => h === handler), 1),
        send: msg => ws.send(JSON.stringify(msg)),
    }

    ws.addEventListener('message', e => {
        const msg = JSON.parse(e.data)
        for (const handler of [...handlers]) handler(msg)
    })

    const apiClient = new vts.ApiClient(bus)

    const initialToken = localStorage.getItem(TOKEN_KEY) ?? undefined
    const plugin = new vts.Plugin(apiClient, 'Heccin Cheers Bot', 'Hawkbar', initialToken)
    const token = await plugin.getAuthenticationToken()
    localStorage.setItem(TOKEN_KEY, token)

    const models = await plugin.models()
    const randomModel = models[Math.floor(Math.random() * models.length)]
    const loadedModel = await randomModel.load()
    const param = await loadedModel.createParameter('TestCustomParameter', -1000, 1000, 100)
    await param.setValue(50)
    await param.delete()
}

connect()
