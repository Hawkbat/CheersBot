import { RedeemModeDisplay, RedeemMode, Icon, Store, MessageMeta, ModeQueueModeConfig } from 'shared'
import * as url from 'url'
import { ChannelData } from './data'

export const EVIL_PATTERN = /\b(evil|crimes|crime|puppy|puppies)[!.,]?\b/i

export function isGirlDm(msg: MessageMeta): boolean {
    const hostname = url.parse(msg.url).hostname ?? ''
    return hostname.trim().toLowerCase().startsWith('girldm.')
}

export function addModeDelayed(store: Store<ChannelData>, mode: RedeemMode): void {
    store.update(d => {
        mode.visible = false
        d.modules.modeQueue.state.modes.push(mode)
    })
    setTimeout(() => {
        store.update(d => {
            const m = d.modules.modeQueue.state.modes.find(m => m.id === mode.id)
            if (m) m.visible = true
        })
    }, 1000)
}

export function removeModeDelayed(store: Store<ChannelData>, mode: RedeemMode): void {
    store.update(d => {
        const m = d.modules.modeQueue.state.modes.find(m => m.id === mode.id)
        if (m) m.visible = false
    })
    setTimeout(() => {
        store.update(d => {
            d.modules.modeQueue.state.modes = d.modules.modeQueue.state.modes.filter(m => m.id !== mode.id)
        })
    }, 1000)
}

export function getDisplayModes(modes: RedeemMode[], configs: ModeQueueModeConfig[]): RedeemModeDisplay[] {
    return modes.map(mode => {
        const config = configs.find(c => c.id === mode.configID)!
        const inModePeriod = mode.startTime && mode.duration && (Date.now() - mode.startTime) < mode.duration
        let msg = ''
        if (!mode.startTime) {
            msg = config.startText
        } else if (inModePeriod && mode.startTime && mode.duration) {
            const minutesLeft = Math.ceil((mode.duration - (Date.now() - mode.startTime)) / (60 * 1000))
            const minuteText = minutesLeft === 1 ? 'minute' : 'minutes'
            msg = config.runningText
                .replace('[minutesLeft]', minutesLeft.toString())
                .replace('[minutes]', minuteText)
        } else {
            msg = config.endText
        }
        let icon: Icon = config.emote ?? { type: 'logo', id: 'hawkbar', name: 'Hawkbar' }
        return {
            ...mode,
            icon,
            msg,
            showName: config.showUsername,
        }
    })
}
