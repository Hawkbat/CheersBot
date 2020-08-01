import * as fs from 'fs'
import * as path from 'path'
import fetch from 'node-fetch'
import { parseJSON } from 'shared'

export async function getJSON<T>(url: string): Promise<T | null> {
    try {
        return parseJSON<T>(await (await fetch(url)).text())
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

export function readJSON<T>(uri: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
        fs.readFile(uri, 'utf8', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') resolve(null)
                else throw reject(err)
            }
            else {
                resolve(parseJSON(data))
            }
        })
    })
}

export function writeJSON<T>(uri: string, data: T): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.writeFile(uri, JSON.stringify(data), 'utf8', err => {
            if (err) reject(err)
            else resolve()
        })
    })
}

export function deleteFile(uri: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.unlink(uri, err => {
            if (err) reject(err)
            else resolve()
        })
    })
}

export function listFiles(uri: string, stripExt: boolean = false): Promise<string[]> {
    return new Promise((resolve, reject) => {
        fs.readdir(uri, (err, files) => {
            if (err) reject(err)
            else resolve(files.map(p => stripExt ? path.basename(p, path.extname(p)) : path.basename(p)))
        })
    })
}
