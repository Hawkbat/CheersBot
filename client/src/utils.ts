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
    let retryTimeout = 1
    let token: WaitToken = {}
    const setup = () => {
        console.log('Connecting')
        const eventSource = new EventSource(url)
        eventSource.addEventListener('message', e => {
            console.log(e.data)
            const data = parseJSON<{ type: string }>(e.data)
            if (data) cb(data)
        })
        eventSource.addEventListener('open', e => {
            console.log('Connected')
            retryTimeout = 1
        })
        eventSource.addEventListener('error', async e => {
            console.log('Connection lost')
            eventSource.close()
            await debounce(retryTimeout, token)
            setup()
        })
        retryTimeout *= 2
        retryTimeout = Math.min(64, retryTimeout)
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
