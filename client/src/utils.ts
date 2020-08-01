import { parseJSON } from 'shared'

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
        const response = await fetch(url)
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
            body: JSON.stringify(data)
        })).text())
    } catch (e) {
        console.error(e)
        return null
    }
}
