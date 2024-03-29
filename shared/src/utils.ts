import { logError } from './logging'

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
const ID_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-'

function reviver(key: string, value: any) {
    if (typeof value === 'string' && DATE_FORMAT.test(value)) return new Date(value)
    return value
}

export function generateID(length: number = 8): string {
    let id = ''
    for (let i = 0; i < length; i++) {
        id += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length) % ID_CHARS.length]
    }
    return id
}

export function parseJSON<T>(json: string): T | null {
    try {
        return JSON.parse(json, reviver)
    } catch (e) {
        logError('unknown', 'parseJSON', `Failed to parse JSON`, e, json)
        return null
    }
}

export interface WaitToken {
    handle?: number
}

export function debounce(ms: number, token: WaitToken): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            clearTimeout(token.handle)
            token.handle = setTimeout(() => {
                resolve()
            }, ms)
        } catch (e) {
            reject(e)
        }
    })
}

export function mergePartials<T extends { [key: string]: any }>(base: T, ...targets: { [key: string]: any }[]): T {
    let data: any = { ...base }
    for (const target of targets) {
        for (const key of Object.keys(target)) {
            const dstObj = data[key]
            const srcObj = target[key]
            if (isObject(dstObj) && isObject(srcObj)) {
                data[key] = mergePartials(dstObj, srcObj)
            } else {
                data[key] = target[key]
            }
        }
    }
    return data
}

export function filterFalsy<T>(v: T | null | undefined | false): v is T {
    return !!v
}

export function uniqueItems<T>(arr: T[], hash?: (v: T) => string | number | boolean | null | undefined): T[] {
    return arr.filter((a, i) => i === arr.findIndex(b => hash ? hash(b) === hash(a) : b === a))
}

export function keysOf<T extends Record<string, unknown>>(obj: T): (keyof T)[] {
    return Object.keys(obj) as (keyof T)[]
}

export function randomFloat(max: number = 1, min: number = 0) {
    return min + Math.random() * (max - min)
}

export function randomInt(max: number = 1, min: number = 0) {
    return Math.floor(randomFloat(max, min))
}

export function randomItem<T>(arr: T[]): T {
    return arr[randomInt(arr.length)]
}

export function randomWeightedItem<T>(arr: T[], weightMapping: (v: T) => number): T {
    const totalWeight = arr.reduce((p, c) => p + weightMapping(c), 0)
    const targetWeight = randomFloat(totalWeight)
    let weightLow = 0
    for (const v of arr) {
        const weight = weightMapping(v)
        const weightHigh = weightLow + weight
        if (targetWeight >= weightLow && targetWeight < weightHigh) {
            return v
        }
    }
    return arr[arr.length - 1]
}

export function safeParseInt(s: string, radix = 10): number | null {
    const result = parseInt(s, radix)
    if (Number.isNaN(result)) return null
    return result
}

export function safeParseFloat(s: string): number | null {
    const result = parseFloat(s)
    if (Number.isNaN(result)) return null
    return result
}

function isObject(item: any): item is { [key: string]: any } {
    return item !== null && typeof item === 'object' && !Array.isArray(item)
}

type UnresolvedObject<T> = { [K in keyof T]: T[K] extends Promise<infer U> ? T[K] : never }
type ResolvedObject<T> = { [K in keyof T]: T[K] extends Promise<infer U> ? U : never }

export async function resolveObject<T>(object: UnresolvedObject<T>): Promise<ResolvedObject<T>> {
    const keys = Object.keys(object) as any as (keyof T)[]
    const results = await Promise.all(keys.map(k => object[k]))
    const result = {} as any
    results.forEach((r, i) => result[keys[i]] = r)
    return result as ResolvedObject<T>
}

export type DeepPartial<T> =
    T extends Function | boolean | number | string | null | undefined ? T :
    T extends Array<infer U> ? T :
    T extends Map<infer K, infer V> ? T :
    T extends Set<infer S> ? T :
    T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } :
    T

export type Immutable<T> =
    T extends Function | boolean | number | string | null | undefined ? T :
    T extends Array<infer U> ? ReadonlyArray<Immutable<U>> :
    T extends Map<infer K, infer V> ? ReadonlyMap<Immutable<K>, Immutable<V>> :
    T extends Set<infer S> ? ReadonlySet<Immutable<S>> :
    { readonly [P in keyof T]: Immutable<T[P]> }

export class Store<T> {
    private getCallbacks: ((data: T) => T | Promise<T>)[] = []
    private setCallbacks: ((data: T) => T | Promise<T>)[] = []
    private getToken: WaitToken = {}
    private setToken: WaitToken = {}
    private locked: boolean = false

    constructor(private data: T) { }

    onRead(cb: (data: T) => T | Promise<T>): this {
        this.getCallbacks.unshift(cb)
        return this
    }

    onWrite(cb: (data: T) => T | Promise<T>): this {
        this.setCallbacks.unshift(cb)
        return this
    }

    offRead(cb: (data: T) => T | Promise<T>): this {
        this.getCallbacks = this.getCallbacks.filter(c => c === cb)
        return this
    }

    offWrite(cb: (data: T) => T | Promise<T>): this {
        this.setCallbacks = this.setCallbacks.filter(c => c !== cb)
        return this
    }

    get<U>(getter: (data: T) => U): U {
        const result = getter(this.data)
        this.doRead()
        return result
    }

    set(setter: (data: T) => T): void {
        if (this.locked) return
        this.data = setter(this.data)
        this.doWrite()
    }

    update(updater: (data: T) => void): void {
        if (this.locked) return
        updater(this.data)
        this.doWrite()
    }

    touch(): void {
        if (this.locked) return
        this.doWrite()
    }

    lock(): void {
        this.locked = true
    }

    unlock(): void {
        this.locked = false
    }

    private async doRead() {
        await debounce(1000, this.getToken)
        for (const cb of this.getCallbacks) this.data = await cb(this.data)
    }

    private async doWrite() {
        await debounce(1000, this.setToken)
        for (const cb of this.setCallbacks) this.data = await cb(this.data)
    }
}

export type Props<T extends (props: any, ...args: any) => any> = Parameters<T>[0]
