
export type LogLevel = 'TRACE' | 'INFO' | 'WARN' | 'ERR'

export type LogMessage = [timestamp: string, type: LogLevel, channel: string, scope: string, ...args: any[]]

const MAX_LOG_BUFFER_SIZE = 50

let logBuffer: LogMessage[] = []

export function logMessage(msg: LogMessage) {
    const type = msg[1]
    switch (type) {
        case 'TRACE':
            console.log(...msg)
            break
        case 'INFO':
            console.info(...msg)
            break
        case 'WARN':
            console.warn(...msg)
            break
        case 'ERR':
            console.error(...msg)
            break
    }
    logBuffer.push(msg)
    while (logBuffer.length > MAX_LOG_BUFFER_SIZE) logBuffer.shift()
}

export function log(type: LogLevel, channel: string, scope: string, ...msgs: any[]) {
    const msg: LogMessage = [new Date().toISOString(), type, `[${channel}]`, `(${scope})`, ...msgs.map(m => {
        if (m !== null && typeof m === 'object') {
            if (m instanceof Error) {
                return JSON.stringify({ name: m.name, message: m.message, stack: m.stack })
            }
            return JSON.stringify(m)
        }
        return m
    })]
    logMessage(msg)
}

export function logTrace(channel: string, scope: string, ...msgs: any[]) {
    log('TRACE', channel, scope, ...msgs)
}

export function logInfo(channel: string, scope: string, ...msgs: any[]) {
    log('INFO', channel, scope, ...msgs)
}

export function logWarn(channel: string, scope: string, ...msgs: any[]) {
    log('WARN', channel, scope, ...msgs)
}

export function logError(channel: string, scope: string, ...msgs: any[]) {
    log('ERR', channel, scope, ...msgs)
}

export function peekLogBuffer(): LogMessage[] {
    return [...logBuffer]
}

export function popLogBuffer(): LogMessage[] {
    const buffer = logBuffer
    logBuffer = []
    return buffer
}
