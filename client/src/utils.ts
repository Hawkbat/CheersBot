import * as React from 'react'
import { WaitToken } from 'shared'
import { debounce } from 'shared'
import { parseJSON, ChannelActions, ChannelViews, GlobalActions, GlobalViews, ChannelInfoConfigData } from 'shared'

export function classes(...args: (string | string[] | { [key: string]: boolean })[]): string {
    const list = []
    for (const item of args) {
        if (typeof item === 'string') list.push(item)
        else if (Array.isArray(item)) list.push(...item)
        else if (typeof item === 'object') {
            for (const key in item) {
                if (item[key]) list.push(key)
            }
        }
    }
    return list.join(' ')
}

export function getNumberValue(id: string): number {
    const el = document.getElementById(id)
    if (!el) return NaN
    if (el instanceof HTMLInputElement) return parseInt(el.value)
    else return parseInt(el.textContent ?? '', 10)
}

export function setNumberValue(id: string, value: number): void {
    const el = document.getElementById(id)
    if (!el) return
    if (el instanceof HTMLInputElement) el.value = '' + value
    else el.textContent = '' + value
}

export function getStringValue(id: string): string {
    const el = document.getElementById(id)
    if (!el) return ''
    if (el instanceof HTMLInputElement) return el.value
    else if (el instanceof HTMLSelectElement) return el.options[el.selectedIndex].value
    else return el.textContent ?? ''
}

export function localStoreJSON<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data))
}

export function localRetrieveJSON<T>(key: string): T | null
export function localRetrieveJSON<T>(key: string, defaultValue: T): T
export function localRetrieveJSON<T>(key: string, defaultValue?: T): T | null {
    const str = localStorage.getItem(key)
    if (str === null && defaultValue !== undefined) return defaultValue
    if (str === null) return null
    const value = parseJSON<T>(str)
    if (!value) return null
    return value
}

export async function getJSON<T>(url: string): Promise<T | null> {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store',
        })
        if (!response.ok) {
            return null
        }
        return parseJSON<T>(await response.text())
    } catch (e) {
        console.error(e)
        return null
    }
}

export async function postJSON<T, U>(url: string, data: T): Promise<U | null> {
    try {
        return parseJSON<U>(await (await fetch(url, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            cache: 'no-store',
            body: JSON.stringify(data)
        })).text())
    } catch (e) {
        console.error(e)
        return null
    }
}

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

declare const CHANNEL_NAME: string

function setupEventStream(url: string, cb: (evt: { type: string }) => void) {
    const idleTimeout = 90 * 1000
    let retryTimeout = 1000
    let token: WaitToken = {}
    let eventSource!: EventSource
    const setup = () => {
        retryTimeout = Math.min(32000, retryTimeout * 2)
        console.log('Connecting')
        try {
            if (eventSource && eventSource.readyState === eventSource.OPEN) eventSource.close()
            eventSource = new EventSource(url)
            eventSource.addEventListener('message', e => {
                console.log(e.data)
                const data = parseJSON<{ type: string }>(e.data)
                if (data) cb(data)
                debounce(idleTimeout, token).then(() => setup())
            })
            eventSource.addEventListener('open', e => {
                console.log('Connected')
                retryTimeout = 1000
                debounce(idleTimeout, token).then(() => setup())
            })
            eventSource.addEventListener('error', e => {
                console.log('Connection lost')
                eventSource.close()
                debounce(retryTimeout, token).then(() => setup())
            })
            debounce(idleTimeout, token).then(() => setup())
        } catch (e) {
            console.error(e)
            debounce(retryTimeout, token).then(() => setup())
        }
    }
    setup()
}

let refreshCallback: ((reloadData: boolean) => void) | null = null

export function setRefreshCallback(refresh: (reloadData: boolean) => void, channelView: boolean, intervalMinutes: number = 5) {
    refreshCallback = refresh

    function tryRefresh(reloadData: boolean) {
        try {
            refresh(reloadData)
        } catch (e) {
            console.error(e)
        }
    }

    if (channelView) {
        channelEvents(e => {
            if (e.type === 'refresh') tryRefresh(true)
        })
    } else {
        globalEvents(e => {
            if (e.type === 'refresh') tryRefresh(true)
        })
    }

    setInterval(() => tryRefresh(true), intervalMinutes * 60 * 60 * 1000)
    runEveryFrame(() => tryRefresh(false))
    tryRefresh(true)
}

export function refresh(reloadData: boolean) {
    refreshCallback?.(reloadData)
}

export function channelEvents(cb: (evt: { type: string }) => void): void {
    setupEventStream(`/${CHANNEL_NAME}/sse/?t=${Date.now()}`, cb)
}

export async function channelAction<K extends keyof ChannelActions>(action: K, args: Parameters<ChannelActions[K]>[0]): Promise<UnwrapPromise<ReturnType<ChannelActions[K]>> | undefined> {
    try {
        const result = await postJSON<typeof args, UnwrapPromise<ReturnType<ChannelActions[K]>>>(`/${CHANNEL_NAME}/actions/${action}`, args)
        if (!result) throw new Error(`Error calling action ${action} with args ${JSON.stringify(args)}`)
        refresh(true)
        return result
    } catch (e) {
        console.error(e)
        return undefined
    }
}

export async function channelView<K extends keyof ChannelViews>(view: K): Promise<UnwrapPromise<ReturnType<ChannelViews[K]>> | undefined> {
    try {
        const result = await getJSON<UnwrapPromise<ReturnType<ChannelViews[K]>>>(`/${CHANNEL_NAME}/data/${view}`)
        if (!result) throw new Error(`Error calling view ${view}`)
        return result
    } catch (e) {
        console.error(e)
        return undefined
    }
}

export function globalEvents(cb: (evt: { type: string }) => void): void {
    setupEventStream(`/sse/?t=${Date.now()}`, cb)
}

export async function globalAction<K extends keyof GlobalActions>(action: K, args: Parameters<GlobalActions[K]>[0]): Promise<UnwrapPromise<ReturnType<GlobalActions[K]>> | undefined> {
    try {
        const result = await postJSON<typeof args, UnwrapPromise<ReturnType<GlobalActions[K]>>>(`/actions/${action}`, args)
        if (!result) throw new Error(`Error calling action ${action} with args ${JSON.stringify(args)}`)
        refresh(true)
        return result
    } catch (e) {
        console.error(e)
        return undefined
    }
}

export async function globalView<K extends keyof GlobalViews>(view: K): Promise<UnwrapPromise<ReturnType<GlobalViews[K]>> | undefined> {
    try {
        const result = await getJSON<UnwrapPromise<ReturnType<GlobalViews[K]>>>(`/data/${view}`)
        if (!result) throw new Error(`Error calling view ${view}`)
        return result
    } catch (e) {
        console.error(e)
        return undefined
    }
}

export function getChannelCSS(config: ChannelInfoConfigData): React.CSSProperties {
    return {
        '--accent-color': config.accentColor,
        '--muted-color': config.mutedColor,
    } as React.CSSProperties
}

export function runEveryFrame(cb: () => void) {
    const f = () => {
        cb()
        requestAnimationFrame(f)
    }
    requestAnimationFrame(f)
}

export function waitUntil(cb: () => boolean, timeout: number = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
        const intervalHandle = setInterval(() => {
            if (cb()) {
                clearInterval(intervalHandle)
                clearTimeout(timeoutHandle)
                resolve()
            }
        }, 16)
        const timeoutHandle = setTimeout(() => {
            clearInterval(intervalHandle)
            reject(new Error('Wait timed out'))
        }, timeout)
    })
}

export function wait(ms: number): Promise<void> {
    return new Promise(res => {
        setTimeout(() => res(), ms)
    })
}

export function useInterval(callback: () => void, interval: number, runImmediately: boolean) {
    React.useEffect(() => {
        if (runImmediately) callback()
        const handle = setInterval(() => callback(), interval)
        return () => clearInterval(handle)
    }, [callback, interval])
}

export function useCallbackProgress<T extends (...args: any[]) => any>(callback?: T): [callback: (...args: Parameters<T>) => Promise<ReturnType<T>>, inProgress: boolean] {
    const [inProgress, setInProgress] = React.useState(false)
    const cb = React.useCallback(async (...args: Parameters<T>) => {
        setInProgress(true)
        const result: ReturnType<T> = await callback?.(...args)
        setInProgress(false)
        return result
    }, [callback])
    return [cb, inProgress]
}

export class BufferedWebsocket implements WebSocket {
    ws!: WebSocket

    private _url: string
    private _protocols: string | string[] | undefined
    private bufferedSends: (string | ArrayBufferLike | Blob | ArrayBufferView)[] = []
    private eventListeners: Map<string, { listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions }[]> = new Map()
    private reconnectHandle: number | null = null
    private reconnectTimeout = 0

    get url() { return this._url }
    set url(v: string) {
        if (v !== this._url) {
            this._url = v
            this.performReconnect()
        }
    }

    get protocol(): string { return this.ws.protocol }
    get readyState(): number { return this.ws.readyState }

    get binaryType(): BinaryType { return this.ws.binaryType }
    set binaryType(binaryType: BinaryType) { this.ws.binaryType = binaryType }
    get bufferedAmount(): number { return this.ws.bufferedAmount }
    get extensions(): string { return this.ws.extensions }

    get CLOSED(): number { return this.ws.CLOSED }
    get CLOSING(): number { return this.ws.CLOSING }
    get CONNECTING(): number { return this.ws.CONNECTING }
    get OPEN(): number { return this.ws.OPEN }

    constructor(url: string, protocols?: string | string[]) {
        this._url = url
        this._protocols = protocols
        this.performReconnect()
    }

    onopen: ((this: WebSocket, ev: Event) => any) | null = null
    onmessage: ((this: WebSocket, ev: MessageEvent<any>) => any) | null = null
    onerror: ((this: WebSocket, ev: Event) => any) | null = null
    onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null

    addEventListener<K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
        const listeners = this.eventListeners.get(type) ?? []
        listeners.push({ listener, options })
        this.eventListeners.set(type, listeners)
        this.ws.addEventListener(type, listener, options)
    }

    removeEventListener<K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | EventListenerOptions): void
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
        const listeners = this.eventListeners.get(type) ?? []
        const index = listeners.findIndex(l => l.listener === listener && (l.options === options || (typeof l.options === 'object' && typeof options === 'object' && l.options.capture === options.capture)))
        if (index >= 0) listeners.splice(index, 1)
        this.ws.removeEventListener(type, listener, options)
    }

    dispatchEvent(event: Event): boolean {
        return this.ws.dispatchEvent(event)
    }

    close(code?: number, reason?: string): void {
        this.ws.close(code, reason)
    }

    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
        if (this.ws.readyState === this.ws.OPEN) {
            this.ws.send(data)
        } else {
            this.bufferedSends.unshift(data)
        }
    }

    private performReconnect() {
        try {
            const prev: WebSocket | undefined = this.ws
            if (prev && prev.readyState === prev.OPEN) prev.close(3012, 'Reconnecting')

            // Terrible hack to guarantee that the first websocket will always be instantiated successfully
            const next = new WebSocket(prev ? this._url : 'wss://echo.websocket.org', this._protocols)

            next.binaryType = prev?.binaryType ?? next.binaryType
            next.onopen = prev?.onopen ?? next.onopen
            next.onmessage = prev?.onmessage ?? next.onmessage
            next.onerror = prev?.onerror ?? next.onerror
            next.onclose = prev?.onclose ?? next.onclose

            this.ws = next
            if (!prev) this.reconnect()

            for (const [type, listeners] of this.eventListeners.entries()) {
                for (const listener of listeners) {
                    if (prev) prev.removeEventListener(type, listener.listener, listener.options)
                    next.addEventListener(type, listener.listener, listener.options)
                }
            }
            next.addEventListener('open', ev => {
                if (next !== this.ws) {
                    next.close(3012, 'Reconnecting')
                    return
                }
                this.reconnectTimeout = 0
                this.onopen?.(ev)
                while (this.bufferedSends.length) next.send(this.bufferedSends.pop()!)
            })
            next.addEventListener('message', ev => {
                this.onmessage?.(ev)
            })
            next.addEventListener('error', ev => {
                this.onerror?.(ev)
            })
            next.addEventListener('close', ev => {
                this.onclose?.(ev)
                if (next === this.ws) {
                    this.reconnect()
                }
            })
        } catch (e) {
            console.error(e)
            this.reconnect()
        }
    }

    reconnect() {
        if (this.reconnectHandle) {
            clearTimeout(this.reconnectHandle)
            this.reconnectHandle = null
        }
        this.reconnectHandle = setTimeout(() => this.performReconnect(), this.reconnectTimeout)
        this.reconnectTimeout = Math.min(32000, Math.max(1000, this.reconnectTimeout) * 2)
    }
}
