import { parseJSON, ChannelActions, ChannelViews, GlobalActions, GlobalViews } from 'shared'

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
            cache: 'no-cache',
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
            cache: 'no-cache',
            body: JSON.stringify(data)
        })).text())
    } catch (e) {
        console.error(e)
        return null
    }
}

declare const CHANNEL_NAME: string

export async function channelAction<K extends keyof ChannelActions>(action: K, args: Parameters<ChannelActions[K]>[0]): Promise<ReturnType<ChannelActions[K]> | undefined> {
    try {
        const result = await postJSON<typeof args, ReturnType<ChannelActions[K]>>(`/${CHANNEL_NAME}/actions/${action}`, args)
        if (!result) throw new Error(`Error calling action ${action} with args ${JSON.stringify(args)}`)
        return result
    } catch (e) {
        console.error(e)
        return undefined
    }
}

export async function channelView<K extends keyof ChannelViews>(view: K): Promise<ReturnType<ChannelViews[K]> | undefined> {
    try {
        const result = await getJSON<ReturnType<ChannelViews[K]>>(`/${CHANNEL_NAME}/data/${view}`)
        if (!result) throw new Error(`Error calling view ${view}`)
        return result
    } catch (e) {
        console.error(e)
        return undefined
    }
}

export async function globalAction<K extends keyof GlobalActions>(action: K, args: Parameters<GlobalActions[K]>[0]): Promise<ReturnType<GlobalActions[K]> | undefined> {
    try {
        const result = await postJSON<typeof args, ReturnType<GlobalActions[K]>>(`/actions/${action}`, args)
        if (!result) throw new Error(`Error calling action ${action} with args ${JSON.stringify(args)}`)
        return result
    } catch (e) {
        console.error(e)
        return undefined
    }
}

export async function globalView<K extends keyof GlobalViews>(view: K): Promise<ReturnType<GlobalViews[K]> | undefined> {
    try {
        const result = await getJSON<ReturnType<GlobalViews[K]>>(`/data/${view}`)
        if (!result) throw new Error(`Error calling view ${view}`)
        return result
    } catch (e) {
        console.error(e)
        return undefined
    }
}


