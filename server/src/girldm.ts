import { MessageMeta } from 'shared'
import * as url from 'url'

export const EVIL_PATTERN = /\b(evil|crimes|crime|puppy|puppies)[!.,]?\b/i

export function isGirlDm(msg: MessageMeta): boolean {
    const hostname = url.parse(msg.url).hostname ?? ''
    return hostname.trim().toLowerCase().startsWith('girldm.')
}
