
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
        console.error(e)
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

    constructor(private data: T) { }

    onRead(cb: (data: T) => T | Promise<T>): this {
        this.getCallbacks.unshift(cb)
        return this
    }

    onWrite(cb: (data: T) => T | Promise<T>): this {
        this.setCallbacks.unshift(cb)
        return this
    }

    get<U>(getter: (data: T) => U): U {
        const result = getter(this.data)
        this.doRead()
        return result
    }

    set(setter: (data: T) => T): void {
        this.data = setter(this.data)
        this.doWrite()
    }

    touch(): void {
        this.doWrite()
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
