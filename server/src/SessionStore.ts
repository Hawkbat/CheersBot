import * as session from 'express-session'
import { SessionData } from 'express-session'
import { deleteFile, readJSON, writeJSON } from './utils'

const workingDir = process.cwd()

declare module 'express-session' {
    interface SessionData {
        twitchUserName?: string
    }
}

function getDir() {
    return workingDir + `/data/session/`
}

function getPath(sid: string) {
    return getDir() + `${sid}.json`
}

export class SessionStore extends session.Store {

    sessions: { [key: string]: SessionData } = {}

    constructor(config: object = {}) {
        super(config)
    }

    get = async (sid: string, callback: (err: any, session?: SessionData | null | undefined) => void) => {
        try {
            if (this.sessions[sid]) {
                callback?.(null, this.sessions[sid])
            } else {
                const session = await readJSON<SessionData>(getPath(sid))
                if (session) {
                    this.sessions[sid] = session
                    callback?.(null, session)
                } else {
                    callback?.(null, null)
                }
            }
        } catch (e) {
            callback?.(e)
        }
    }
    set = async (sid: string, session: SessionData, callback?: ((err?: any) => void) | undefined) => {
        try {
            this.sessions[sid] = session
            await writeJSON<SessionData>(getPath(sid), session)
            callback?.()
        } catch (e) {
            callback?.(e)
        }
    }
    touch = async (sid: string, session: SessionData, callback?: ((err?: any) => void) | undefined) => {
        try {
            this.sessions[sid] = session
            callback?.()
        } catch (e) {
            callback?.(e)
        }
    }
    destroy = async (sid: string, callback?: ((err?: any) => void) | undefined) => {
        try {
            delete this.sessions[sid]
            await deleteFile(getPath(sid))
            callback?.()
        } catch (e) {
            callback?.(e)
        }
    }
    clear = async (callback?: ((err?: any) => void) | undefined) => {
        try {
            const deletions: Promise<void>[] = []
            for (const sid in this.sessions) {
                delete this.sessions[sid]
                deletions.push(deleteFile(getPath(sid)))
            }
            await Promise.all(deletions)
            callback?.()
        } catch (e) {
            callback?.(e)
        }
    }
    length = async (callback: (err: any, length: number) => void) => {
        try {
            callback?.(null, Object.keys(this.sessions).length)
        } catch (e) {
            callback?.(e, 0)
        }
    }
    all = async (callback: (err: any, obj?: {
        [sid: string]: SessionData
    } | null | undefined) => void) => {
        try {
            callback?.(null, this.sessions)
        } catch (e) {
            callback?.(e, null)
        }

    }
}
