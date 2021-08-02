import { generateID, Store, mergePartials, AccountType, ChannelActions, ChannelViews, MODULE_TYPES, Access, GlobalActions, GlobalViews, MessageMeta, GlobalBaseViewData, ChannelBaseViewData, VodQueueGame, Changelog, CounterVisibility, filterFalsy, LandingAppViewData, uniqueItems, safeParseInt } from 'shared'
import { ApiClient as TwitchClient, RefreshableAuthProvider, StaticAuthProvider } from 'twitch'
import { ChatClient, PrivateMessage } from 'twitch-chat-client'
import { PubSubClient } from 'twitch-pubsub-client'
import * as Discord from 'discord.js'
import * as express from 'express'
import * as session from 'express-session'
import * as stylus from 'stylus'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as cheerio from 'cheerio'
import fetch from 'node-fetch'
import { readJSON, writeJSON } from './utils'
import { SessionStore } from './SessionStore'
import { EVIL_PATTERN, isGirlDm } from './girldm'
import { Bot, Channel, User, Secrets, AccountData, BotData, TwitchToken, UserData, ChannelData, DiscordToken } from './data'
import { getFFZEmoteURL } from './frankerfacez'
import { TwitchTokenResponse } from './twitch'
import { DiscordTokenResponse } from './discord'
import { getAllIcons } from './icons'
import { textToSpeech } from './tts'

const workingDir = process.cwd()

async function run() {
    const secrets = await readJSON<Secrets>(workingDir + '/secrets.json')
    if (!secrets) throw new Error('secrets.json is missing or incorrectly formatted; app cannot be initialized')

    const changelog = (await readJSON<Changelog>(workingDir + '/changelog.json'))!
    if (!changelog) throw new Error('changelog.json is missing or incorrectly formatted; app cannot be initialized')

    const CLIENT_ID = secrets.twitch.clientID
    const CLIENT_SECRET = secrets.twitch.clientSecret

    const BOT_SCOPES = ['chat:read', 'chat:edit']
    const CHANNEL_SCOPES = ['moderation:read', 'channel:moderate', 'channel:read:redemptions', 'channel:read:subscriptions']
    const USER_SCOPES = ['user:read:email']
    const DISCORD_SCOPES = ['bot', 'identify', 'guilds', 'guilds.join']

    const BAN_TIMEOUT = 10 * 60 * 1000

    const refreshTime = Date.now()
    let localLoggedIn = false

    let bots: { [key: string]: Bot } = {}
    let channels: { [key: string]: Channel } = {}
    let users: { [key: string]: User } = {}

    const app = express()

    function hasTwitchAuth(req: express.Request): boolean {
        return !!req.session?.twitchUserName
    }

    function respondTwitchAuthRedirect(res: express.Response): void {
        res.redirect(`/authorize/${AccountType.user}/`)
    }

    function respondTwitchAuthJSON(res: express.Response): void {
        res.status(403).type('json').send('' + JSON.stringify({ status: 403, error: `You are not logged in!` }))
    }

    function hasChannelAuth(req: express.Request, channel: string): boolean {
        return getUsersForChannel(channel).some(u => u.name === req.session?.twitchUserName) || (secrets?.superUsers.includes(req.session?.twitchUserName ?? '') ?? false)
    }

    function respondChannelAuthMessage(req: express.Request, res: express.Response): void {
        res.status(403)
        renderGlobalView(req, res, 'message', { message: `You don't have access to this channel!` })
    }

    function respondChannelAuthJSON(res: express.Response): void {
        res.status(403).type('json').send('' + JSON.stringify({ status: 403, error: `You don't have access to this channel!` }))
    }

    function hasAnyTokenAuth(req: express.Request): boolean {
        return !!req.header('Authorization')
    }

    function hasValidTokenAuth(req: express.Request, authToken: string): boolean {
        return req.header('Authorization') === `Bearer ${authToken}`
    }

    function respondTokenAuthJSON(res: express.Response): void {
        res.status(403).type('json').send('' + JSON.stringify({ status: 403, error: `Invalid or missing auth token!` }))
    }

    function getMessage(req: express.Request, channel: string): MessageMeta {
        const msg: MessageMeta = {
            id: generateID(),
            username: req.session?.twitchUserName ?? '',
            channel: channel,
            url: `${req.protocol}://${req.hostname}${req.url}`,
        }
        return msg
    }

    function getGlobalViewData(msg: MessageMeta): GlobalBaseViewData {
        return {
            meta: msg,
            refreshTime,
            isGirlDm: isGirlDm(msg),
        }
    }

    function renderGlobalView<T extends keyof GlobalViews>(req: express.Request, res: express.Response, view: T, args: Parameters<GlobalViews[T]>[0]) {
        const msg = getMessage(req, '')
        res.render(view, {
            ...getGlobalViewData(msg),
            ...views[view](args as any, msg),
        })
    }

    function getTokenPath(accountType: AccountType, userName: string): string {
        return workingDir + `/data/${accountType}/${userName}.json`
    }

    function getDefaultData(accountType: AccountType.bot): BotData
    function getDefaultData(accountType: AccountType.channel): ChannelData
    function getDefaultData(accountType: AccountType.user): UserData
    function getDefaultData(accountType: AccountType, token?: TwitchToken): AccountData
    function getDefaultData(accountType: AccountType, token?: TwitchToken): AccountData {
        if (!token) token = { accessToken: '', refreshToken: '', scope: [] }
        const DEFAULT_DATA_CHANNEL: ChannelData = {
            token,
            bots: {},
            users: {},
            modules: {
                headpats: {
                    config: {
                        enabled: false,
                        emote: null,
                    },
                    state: {
                        count: 0,
                        streak: 0,
                    },
                },
                evilDm: {
                    config: {
                        enabled: false,
                        emote: null,
                    },
                    state: {
                        count: 0,
                        time: 0,
                    },
                },
                modeQueue: {
                    config: {
                        enabled: false,
                        modes: [],
                    },
                    state: {
                        modes: [],
                    },
                },
                winLoss: {
                    config: {
                        enabled: false,
                        winningEmote: null,
                        tiedEmote: null,
                        losingEmote: null,
                        deathEmote: null,
                        deathDuration: 0,
                    },
                    state: {
                        display: true,
                        wins: 0,
                        losses: 0,
                        draws: 0,
                        deaths: 0,
                        deathTime: 0,
                    },
                },
                userQueue: {
                    config: {
                        enabled: false,
                    },
                    state: {
                        acceptEntries: false,
                        entries: [],
                        rounds: [],
                    },
                },
                vodQueue: {
                    config: {
                        enabled: false,
                        game: VodQueueGame.generic,
                        redeemID: '',
                        redeemName: '',
                    },
                    state: {
                        entries: [],
                        patchDate: '',
                    },
                },
                backdrop: {
                    config: {
                        enabled: false,
                    },
                    state: {

                    },
                },
                customMessage: {
                    config: {
                        enabled: false,
                    },
                    state: {
                        messages: [],
                    },
                },
                counters: {
                    config: {
                        enabled: false,
                        configs: [],
                    },
                    state: {
                        counters: {},
                    },
                },
                sounds: {
                    config: {
                        enabled: false,
                        sounds: [],
                        uploads: [],
                    },
                    state: {
                        sounds: [],
                    },
                },
                vtubeStudio: {
                    config: {
                        enabled: false,
                        apiHost: 'localhost',
                        apiPort: 8001,
                        apiSecure: false,
                        swaps: [],
                        triggers: [],
                        tints: [],
                        useOverlay: true,
                        debugOverlay: false,
                    },
                    state: {
                        swaps: [],
                        triggers: [],
                        tints: [],
                        status: { time: 0, connected: false, apiError: '', readyState: 3 },
                    },
                },
                eventQueue: {
                    config: {
                        enabled: false,
                    },
                    state: {

                    },
                },
                channelInfo: {
                    config: {
                        enabled: true,
                        accentColor: '#00aaff',
                        mutedColor: '#006699',
                        commandPrefix: '!',
                        activeBot: secrets?.superBot ?? '',
                    },
                    state: {

                    },
                },
                debug: {
                    config: {
                        enabled: false,
                        overlayLogs: false,
                    },
                    state: {

                    },
                },
            },
        }
        const DEFAULT_DATA_BOT: BotData = { token, channels: {} }
        const DEFAULT_DATA_USER: UserData = { token, channels: {} }

        switch (accountType) {
            case AccountType.bot: return { ...DEFAULT_DATA_BOT }
            case AccountType.channel: return { ...DEFAULT_DATA_CHANNEL }
            case AccountType.user: return { ...DEFAULT_DATA_USER }
        }
    }

    function setupAuthWorkflow(accountType: AccountType, accessScopes: string[]): void {

        app.get(`/oauth/${accountType}/`, async (req, res) => {
            try {
                const redirectUri = `https://${req.hostname}/oauth/${accountType}/`
                const code = req.query.code

                const result = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=${redirectUri}`, { method: 'POST' })
                const data = await result.json() as TwitchTokenResponse

                const token: TwitchToken = {
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    scope: data.scope,
                }

                const { client } = await generateClient(accountType, token)
                if (client) {
                    const twitchUser = await client.helix.users.getMe()
                    switch (accountType) {
                        case AccountType.bot: {
                            const bot = await setupBot(twitchUser.name)
                            break
                        }
                        case AccountType.channel: {
                            const channel = await setupChannel(twitchUser.name)
                            break
                        }
                        case AccountType.user: {
                            const user = await setupUser(twitchUser.name)
                            if (user && req.session) req.session.twitchUserName = twitchUser.name
                            break
                        }
                    }
                } else {
                    throw new Error(`Failed to generate a ${accountType} client`)
                }
                res.status(200)
                renderGlobalView(req, res, 'message', { message: `Successfully logged in!`, redirect: '/' })
            } catch (e) {
                console.error(`Error registering: `, e)
                res.status(500)
                renderGlobalView(req, res, 'message', { message: `We weren't able to log you in :( Let Hawkbar know the bot is broken!` })
            }
        })

        app.get(`/authorize/${accountType}/`, (req, res) => {
            if (secrets?.local) {
                localLoggedIn = true
                return res.redirect('/')
            }
            renderGlobalView(req, res, 'authorize', { accountType })
        })

        app.get(`/authorize/${accountType}/redirect/`, (req, res) => {
            const redirectUri = `https://${req.hostname}/oauth/${accountType}/`
            const url = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${accessScopes.join('+')}`
            res.redirect(url)
        })
    }

    async function generateClient(accountType: AccountType.bot, userName: string): Promise<{ data: Store<BotData> | null, client: TwitchClient | null }>
    async function generateClient(accountType: AccountType.channel, userName: string): Promise<{ data: Store<ChannelData> | null, client: TwitchClient | null }>
    async function generateClient(accountType: AccountType.user, userName: string): Promise<{ data: Store<UserData> | null, client: TwitchClient | null }>
    async function generateClient(accountType: AccountType, token: TwitchToken): Promise<{ data: Store<AccountData> | null, client: TwitchClient | null }>
    async function generateClient<T extends AccountData>(accountType: AccountType, userNameOrToken: string | TwitchToken): Promise<{ data: Store<T> | null, client: TwitchClient | null }> {
        let userName: string = ''
        let tokenPath: string = ''
        let token: TwitchToken
        try {
            if (typeof userNameOrToken === 'string') {
                userName = userNameOrToken
                tokenPath = getTokenPath(accountType, userName)
                const existingData = await readJSON<T>(tokenPath)
                if (existingData) {
                    token = existingData.token
                } else {
                    throw new Error(`Could not load existing data for ${accountType} ${userName}`)
                }
            } else {
                token = userNameOrToken
            }

            const authProvider = new RefreshableAuthProvider(new StaticAuthProvider(CLIENT_ID, token.accessToken, token.scope, 'user'), {
                clientSecret: CLIENT_SECRET,
                refreshToken: token.refreshToken,
                onRefresh: async token => {
                    try {
                        if (!userName || !tokenPath) {
                            console.error('Attempted to refresh token before username has been retrieved')
                            return
                        }
                        const data = await readJSON<AccountData>(tokenPath)
                        if (data) {
                            data.token = { accessToken: token.accessToken, refreshToken: token.refreshToken, scope: token.scope }
                            await writeJSON(tokenPath, data)
                            console.log(`Refreshed token for ${accountType} ${userName}`)
                        } else {
                            console.log(`Unable to refresh token for ${accountType} ${userName} as file was not found`)
                        }
                    } catch (e) {
                        console.error(`Error refreshing token for ${accountType} ${userName}:`, e)
                    }
                }
            })

            const client = new TwitchClient({ authProvider })

            await client.requestScopes(token.scope)

            const user = await client.helix.users.getMe()
            userName = user.name
            tokenPath = getTokenPath(accountType, userName)

            const existingData = await readJSON<T>(tokenPath)
            const defaultData = getDefaultData(accountType, token) as T
            const accountData = existingData ? mergePartials(defaultData, existingData, { token }) : defaultData

            await writeJSON(tokenPath, accountData)

            const data = new Store(accountData)
            data.onWrite(async v => {
                await writeJSON(tokenPath, v)
                return v
            })

            console.log(`Generated client for ${accountType} ${userName}`)
            return { data, client }
        } catch (e) {
            console.error(`Error generating client for ${accountType} ${userName}:`, e)
            return { data: null, client: null }
        }
    }

    function getBotsForChannel(channel: string): Bot[] {
        const c = channels[channel]
        return c ? Object.values(bots).filter(b => b.data.get(d => d.channels[c.name] === Access.approved) && c.data.get(d => d.bots[b.name] === Access.approved)) : []
    }

    function getUsersForChannel(channel: string): User[] {
        const c = channels[channel]
        return c ? Object.values(users).filter(u => u.data.get(d => d.channels[c.name] === Access.approved) && c.data.get(d => d.users[u.name] === Access.approved)) : []
    }

    function getChannelsForUser(user: string): Channel[] {
        const u = users[user]
        if (secrets?.superUsers.includes(user)) return Object.values(channels)
        return u ? Object.values(channels).filter(c => c.data.get(d => d.users[u.name] === Access.approved) && u.data.get(d => d.channels[c.name] === Access.approved)) : []
    }

    function getChannelsForBot(bot: string): Channel[] {
        const b = bots[bot]
        return b ? Object.values(channels).filter(c => c.data.get(d => d.bots[b.name] === Access.approved) && b.data.get(d => d.channels[c.name] === Access.approved)) : []
    }

    async function setupBot(name: string): Promise<Bot | null> {
        const { data, client } = await generateClient(AccountType.bot, name)
        try {
            if (data && client) {
                const id = (await client.helix.users.getMe()).id

                const chatClient = new ChatClient(client, { botLevel: name === secrets?.superBot ? 'verified' : 'none', requestMembershipEvents: true })
                await chatClient.connect()

                const joined: Record<string, boolean> = {}

                for (const channel of getChannelsForBot(name)) {
                    try {
                        await chatClient.join(channel.name)
                        joined[channel.name] = true
                        console.log(`${name} joined #${channel.name}`)
                    } catch (e) {
                        console.error(e)
                    }
                }

                setInterval(async () => {
                    const validChannels = getChannelsForBot(name)
                    for (const channel in joined) {
                        if (!validChannels.find(c => c.name === channel)) {
                            chatClient.part(channel)
                            delete joined[channel]
                            console.log(`${name} left #${channel}`)
                        }
                    }
                    for (const channel of validChannels) {
                        if (!joined[channel.name]) {
                            try {
                                await chatClient.join(channel.name)
                                joined[channel.name] = true
                                console.log(`${name} joined #${channel.name}`)
                            } catch (e) {
                                console.error(e)
                            }
                        }
                    }
                }, 60 * 1000)

                chatClient.onMessage(async (channel: string, user: string, message: string, msg: PrivateMessage) => {
                    const c = channels[channel.substr(1)]
                    if (!c) return

                    const isActiveBot = c.data.get(d => d.modules.channelInfo.config.activeBot === name)
                    if (!isActiveBot) return

                    const isUser = getUsersForChannel(c.name).some(u => u.name === user) || msg.userInfo.isBroadcaster || msg.userInfo.isMod
                    if (!isUser) return

                    const commandPrefix = c.data.get(d => d.modules.channelInfo.config.commandPrefix)

                    const parts = message.split(/\b/g).map(p => p.trim()).filter(p => p.length)
                    const prefix = parts.shift()
                    const command = parts.shift()
                    const args = parts

                    switch (prefix) {
                        case 'girldmCheer':
                            switch (command) {
                                case 'girldmHeadpat':
                                    chatClient?.say(channel, 'girldmCheer')
                                    break
                            }
                            break
                        case commandPrefix:
                            const hasOperator = args[0] === '+' || args[0] === '-' || args[0] === '='
                            const operator = hasOperator ? args[0] : '+'
                            const parsedAmount = hasOperator ? safeParseInt(args[1], 10) : safeParseInt(args[0], 10)
                            const hasAmount = parsedAmount !== null
                            const amount = parsedAmount ?? 1
                            switch (command) {
                                case 'cheersbot':
                                    chatClient?.say(channel, 'girldmCheer')
                                    break
                                case 'win':
                                case 'wins':
                                    c.data.update(d => {
                                        if (operator === '+') d.modules.winLoss.state.wins += amount
                                        if (operator === '-') d.modules.winLoss.state.wins -= amount
                                        if (operator === '=' && hasAmount) d.modules.winLoss.state.wins = amount
                                    })
                                    break
                                case 'loss':
                                case 'losses':
                                    c.data.update(d => {
                                        if (operator === '+') d.modules.winLoss.state.losses += amount
                                        if (operator === '-') d.modules.winLoss.state.losses -= amount
                                        if (operator === '=' && hasAmount) d.modules.winLoss.state.losses = amount
                                    })
                                    break
                                case 'draw':
                                case 'draws':
                                    c.data.update(d => {
                                        if (operator === '+') d.modules.winLoss.state.draws += amount
                                        if (operator === '-') d.modules.winLoss.state.draws -= amount
                                        if (operator === '=' && hasAmount) d.modules.winLoss.state.draws = amount
                                    })
                                    break
                                case 'death':
                                case 'deaths':
                                    c.data.update(d => {
                                        if (operator === '+') d.modules.winLoss.state.deaths += amount
                                        if (operator === '-') d.modules.winLoss.state.deaths -= amount
                                        if (operator === '=' && hasAmount) d.modules.winLoss.state.deaths = amount
                                        d.modules.winLoss.state.deathTime = Date.now()
                                    })
                                    break
                                case 'reset':
                                    c.data.update(d => {
                                        d.modules.winLoss.state.wins = 0
                                        d.modules.winLoss.state.losses = 0
                                        d.modules.winLoss.state.draws = 0
                                        d.modules.winLoss.state.deaths = 0
                                    })
                                    break
                            }
                            break
                    }
                })

                return bots[name] = {
                    id,
                    name,
                    data,
                    client,
                    chatClient,
                    joined,
                }
            }
        } catch (e) {
            console.error(`Error setting up bot ${name}:`, e)
        }
        return null
    }

    async function setupChannel(name: string): Promise<Channel | null> {
        const { data, client } = await generateClient(AccountType.channel, name)
        try {
            if (data && client) {
                function getChannelViewData(msg: MessageMeta): ChannelBaseViewData {
                    return {
                        channel: name,
                        meta: msg,
                        refreshTime,
                        isGirlDm: isGirlDm(msg),
                    }
                }

                async function renderChannelView<T extends keyof ChannelViews>(req: express.Request, res: express.Response, view: T, args: Parameters<ChannelViews[T]>[0]) {
                    const msg = getMessage(req, name)
                    res.render(view, await views[view](args, msg))
                }

                let refreshTime = Date.now()
                const authToken = generateID(32)

                const id = (await client.helix.users.getMe()).id

                const router = express.Router()
                router.use(express.json())

                const pubSubClient = new PubSubClient()
                await pubSubClient.registerUserListener(client, id)

                if (data.get(d => d.token.scope.includes('channel:read:redemptions'))) {
                    pubSubClient.onRedemption(id, msg => {
                        switch (msg.rewardName.trim()) {
                            case 'girldm headpats':
                                data.update(d => {
                                    d.modules.headpats.state.count++
                                    d.modules.headpats.state.streak++
                                })

                                if (!msg['_data'].data.redemption.reward.is_in_stock) {
                                    for (const bot of getBotsForChannel(name)) {
                                        if (data.get(d => d.modules.channelInfo.config.activeBot === bot.name)) {
                                            bot.chatClient.action(name, 'Out of headpats because dm is dented! girldmHeadpat girldmHeadpat girldmHeadpat girldmHeadpat')
                                        }
                                    }
                                }
                                break
                            case 'girldm say something!!':
                                if (EVIL_PATTERN.test(msg.message)) {
                                    data.update(d => {
                                        d.modules.evilDm.state.count++
                                        d.modules.evilDm.state.time = Date.now()
                                    })
                                }
                                break
                        }
                        const modeConfig = data.get(d => d.modules.modeQueue.config.modes.find(m => m.redeemID === msg.rewardId || m.redeemName.trim() === msg.rewardName.trim()))
                        if (modeConfig) {
                            const id = generateID()
                            data.update(d => {
                                d.modules.modeQueue.state.modes.push({
                                    id,
                                    configID: modeConfig.id,
                                    userID: msg.userId,
                                    userName: msg.userDisplayName,
                                    message: '',
                                    amount: 1,
                                    redeemTime: Date.now(),
                                    visible: true,
                                    startTime: modeConfig.autoStart ? Date.now() : undefined,
                                    duration: modeConfig.autoStart ? modeConfig.duration * 60 * 1000 : undefined,
                                })
                            })
                            if (modeConfig.autoStart && modeConfig.autoEnd) {
                                setTimeout(() => {
                                    data.update(d => {
                                        d.modules.modeQueue.state.modes = d.modules.modeQueue.state.modes.filter(m => m.id !== id)
                                    })
                                }, modeConfig.duration * 60 * 1000)
                            }
                        }
                        const isVodConfig = data.get(d => d.modules.vodQueue.config.redeemID === msg.rewardId || d.modules.vodQueue.config.redeemName.trim() === msg.rewardName.trim())
                        if (isVodConfig) {
                            data.update(d => d.modules.vodQueue.state.entries.push({
                                id: generateID(),
                                user: { id: msg.userId, name: msg.userName },
                                time: Date.now(),
                                context: msg.message,
                            }))
                        }
                        const counterConfig = data.get(d => d.modules.counters.config.configs.find(c => c.redeemID === msg.rewardId || c.redeemName.trim() === msg.rewardName.trim()))
                        if (counterConfig) {
                            const counter = data.get(d => d.modules.counters.state.counters[counterConfig.id])
                            data.update(d => d.modules.counters.state.counters[counterConfig.id] = {
                                ...counter,
                                count: (counter?.count ?? 0) + 1,
                                time: Date.now(),
                            })
                        }
                        const soundConfig = data.get(d => d.modules.sounds.config.sounds.find(c => c.redeemID === msg.rewardId || c.redeemName.trim() === msg.rewardName.trim()))
                        if (soundConfig) {
                            data.update(d => d.modules.sounds.state.sounds.push({
                                id: generateID(),
                                userID: msg.userId,
                                userName: msg.userDisplayName,
                                configID: soundConfig.id,
                                redeemTime: Date.now(),
                            }))
                        }
                        const modelSwapConfig = data.get(d => d.modules.vtubeStudio.config.swaps.find(c => c.redeemID === msg.rewardId || c.redeemName.trim() === msg.rewardName.trim()))
                        if (modelSwapConfig) {
                            data.update(d => d.modules.vtubeStudio.state.swaps.push({
                                id: generateID(),
                                userID: msg.userId,
                                userName: msg.userDisplayName,
                                configID: modelSwapConfig.id,
                                redeemTime: Date.now(),
                            }))
                        }
                        const hotkeyTriggerConfig = data.get(d => d.modules.vtubeStudio.config.triggers.find(c => c.redeemID === msg.rewardId || c.redeemName.trim() === msg.rewardName.trim()))
                        if (hotkeyTriggerConfig) {
                            data.update(d => d.modules.vtubeStudio.state.triggers.push({
                                id: generateID(),
                                userID: msg.userId,
                                userName: msg.userDisplayName,
                                configID: hotkeyTriggerConfig.id,
                                redeemTime: Date.now(),
                            }))
                        }

                        const colorTintConfig = data.get(d => d.modules.vtubeStudio.config.tints.find(c => c.redeemID === msg.rewardId || c.redeemName.trim() === msg.rewardName.trim()))
                        if (colorTintConfig) {
                            data.update(d => d.modules.vtubeStudio.state.tints.push({
                                id: generateID(),
                                userID: msg.userId,
                                userName: msg.userDisplayName,
                                configID: colorTintConfig.id,
                                redeemTime: Date.now(),
                            }))
                        }
                    })
                }

                if (data.get(d => d.token.scope.includes('channel:moderate'))) {
                    pubSubClient.onModAction(id, id, msg => {
                        if (msg.action === 'timeout') {
                            const username = msg.args[0]
                            const duration = parseFloat(msg.args[1])
                            const ban = data.get(d => d.modules.modeQueue.state.modes.find(b => d.modules.modeQueue.config.modes.some(m => b.configID === m.id && m.redeemName === 'girldm heccin ban me') && b.userName.toLowerCase() === username.toLowerCase()))
                            if (ban) {
                                ban.startTime = Date.now()
                                ban.duration = BAN_TIMEOUT
                                for (const bot of getBotsForChannel(name)) {
                                    if (data.get(d => d.modules.channelInfo.config.activeBot === bot.name)) {
                                        bot.chatClient.action(name, `Goodbye, @${username}! Have a nice heccin time while being banned girldmCheer`)
                                    }
                                }
                            }
                        } else if (msg.action === 'untimeout') {
                            const username = msg.args[0]
                            const ban = data.get(d => d.modules.modeQueue.state.modes.find(b => d.modules.modeQueue.config.modes.some(m => b.configID === m.id && m.redeemName === 'girldm heccin ban me') && b.userName.toLowerCase() === username.toLowerCase()))
                            if (ban) {
                                for (const bot of getBotsForChannel(name)) {
                                    if (data.get(d => d.modules.channelInfo.config.activeBot === bot.name)) {
                                        bot.chatClient.action(name, `Welcome back, @${username}! girldmCheer`)
                                    }
                                }
                                data.update(d => {
                                    d.modules.modeQueue.state.modes = d.modules.modeQueue.state.modes.filter(m => m.id !== ban.id)
                                })
                            }
                        }
                    })
                }

                setInterval(async () => {
                    if (data.get(d => d.modules.vodQueue.config.enabled && d.modules.vodQueue.config.game === VodQueueGame.overwatch)) {
                        const html = await (await fetch('https://playoverwatch.com/en-us/news/patch-notes/')).text()
                        const $ = cheerio.load(html)
                        const latestPatchDate = $('.PatchNotes-patch').first().attr('id')
                        if (latestPatchDate) {
                            data.update(d => {
                                d.modules.vodQueue.state.patchDate = latestPatchDate.substr('patch-'.length)
                            })
                        }
                    }
                }, 10 * 60 * 1000)

                const actions: ChannelActions = {
                    'headpats/adjust': args => {
                        data.update(d => {
                            d.modules.headpats.state.count += args.delta
                            if (args.delta > 0) d.modules.headpats.state.streak += args.delta
                        })
                        if (data.get(d => d.modules.headpats.state.count) === 0 && data.get(d => d.modules.headpats.state.streak) > 1) {
                            for (const bot of getBotsForChannel(name)) {
                                if (data.get(d => d.modules.channelInfo.config.activeBot === bot.name)) {
                                    bot.chatClient.action(name, `${data.get(d => d.modules.headpats.state.streak)} headpat streak! girldmCheer girldmCheer girldmCheer girldmHeadpat girldmHeadpat girldmHeadpat`)
                                }
                            }
                            data.update(d => {
                                d.modules.headpats.state.streak = 0
                            })
                        }
                        return true
                    },
                    'headpats/set-emote': args => {
                        data.update(d => {
                            d.modules.headpats.config.emote = args.emote
                        })
                        return true
                    },
                    'evildm/adjust': args => {
                        data.update(d => {
                            d.modules.evilDm.state.count += args.delta
                            d.modules.evilDm.state.time = Date.now()
                        })
                        return true
                    },
                    'evildm/set-emote': args => {
                        data.update(d => {
                            d.modules.evilDm.config.emote = args.emote
                        })
                        return true
                    },
                    'modequeue/start': args => {
                        const mode = data.get(d => d.modules.modeQueue.state.modes.find(m => m.id === args.id))
                        if (mode) {
                            data.update(d => {
                                const m = d.modules.modeQueue.state.modes.find(m => m.id === mode.id)
                                if (m) {
                                    m.startTime = Date.now()
                                    m.duration = args.duration

                                    const config = d.modules.modeQueue.config.modes.find(c => c.id === m.configID)
                                    if (config?.autoEnd) {
                                        setTimeout(() => {
                                            data.update(d => {
                                                d.modules.modeQueue.state.modes = d.modules.modeQueue.state.modes.filter(m => m.id !== id)
                                            })
                                        }, args.duration)
                                    }
                                }
                            })
                        }
                        return true
                    },
                    'modequeue/clear': args => {
                        const mode = data.get(d => d.modules.modeQueue.state.modes.find(m => m.id === args.id))
                        if (mode) {
                            data.update(d => {
                                d.modules.modeQueue.state.modes = d.modules.modeQueue.state.modes.filter(m => m.id !== mode.id)
                            })
                        }
                        return true
                    },
                    'modequeue/add-mode': args => {
                        data.update(d => {
                            d.modules.modeQueue.config.modes.push({
                                id: generateID(),
                                redeemID: '',
                                redeemName: '',
                                emote: null,
                                showUsername: false,
                                startText: 'Mode redeemed!',
                                runningText: 'Redeemed mode is active for [secondsLeft] more [seconds]!',
                                endText: 'Redeemed mode is done!',
                                duration: 10,
                                ...args,
                            })
                        })
                        return true
                    },
                    'modequeue/edit-mode': args => {
                        let updated = false
                        data.update(d => {
                            d.modules.modeQueue.config.modes = d.modules.modeQueue.config.modes.map(m => {
                                if (m.id === args.id) {
                                    updated = true
                                    return {
                                        ...m,
                                        ...args,
                                    }
                                } else {
                                    return m
                                }
                            })
                        })
                        return updated
                    },
                    'modequeue/delete-mode': args => {
                        data.update(d => {
                            d.modules.modeQueue.config.modes = d.modules.modeQueue.config.modes.filter(m => m.id !== args.id)
                            d.modules.modeQueue.state.modes = d.modules.modeQueue.state.modes.filter(m => m.configID !== args.id)
                        })
                        return true
                    },
                    'modequeue/set-alarm-volume': args => {
                        data.update(d => {
                            d.modules.modeQueue.config.alarmVolume = args.volume
                        })
                        return true
                    },
                    'modequeue/mock': args => {
                        const config = data.get(d => d.modules.modeQueue.config.modes.find(c => c.id === args.configID))
                        if (config) {
                            const id = generateID()
                            data.update(d => {
                                d.modules.modeQueue.state.modes.push({
                                    id,
                                    configID: config.id,
                                    userID: '',
                                    userName: args.username,
                                    message: '',
                                    amount: 1,
                                    redeemTime: Date.now(),
                                    visible: true,
                                    startTime: config.autoStart ? Date.now() : undefined,
                                    duration: config.autoStart ? config.duration * 60 * 1000 : undefined,
                                })
                            })
                            if (config.autoStart && config.autoEnd) {
                                setTimeout(() => {
                                    data.update(d => {
                                        d.modules.modeQueue.state.modes = d.modules.modeQueue.state.modes.filter(m => m.id !== id)
                                    })
                                }, config.duration * 60 * 1000)
                            }
                            return true
                        }
                        return false
                    },
                    'winloss/set-displayed': args => {
                        data.update(d => {
                            d.modules.winLoss.state.display = args.display
                        })
                        return true
                    },
                    'winloss/adjust-wins': args => {
                        data.update(d => {
                            d.modules.winLoss.state.wins += args.delta
                        })
                        return true
                    },
                    'winloss/adjust-losses': args => {
                        data.update(d => {
                            d.modules.winLoss.state.losses += args.delta
                        })
                        return true
                    },
                    'winloss/adjust-draws': args => {
                        data.update(d => {
                            d.modules.winLoss.state.draws += args.delta
                        })
                        return true
                    },
                    'winloss/adjust-deaths': args => {
                        data.update(d => {
                            d.modules.winLoss.state.deaths += args.delta
                            if (args.delta > 0) d.modules.winLoss.state.deathTime = Date.now()
                        })
                        return true
                    },
                    'winloss/clear': args => {
                        data.update(d => {
                            d.modules.winLoss.state.wins = 0
                            d.modules.winLoss.state.losses = 0
                            d.modules.winLoss.state.draws = 0
                            d.modules.winLoss.state.deaths = 0
                        })
                        return true
                    },
                    'winloss/set-config': args => {
                        data.update(d => {
                            d.modules.winLoss.config = {
                                ...d.modules.winLoss.config,
                                ...args,
                            }
                        })
                        return true
                    },
                    'backdrop/fire-cannon': args => {
                        return true
                    },
                    'backdrop/swap-camera': args => {
                        return true
                    },
                    'vodqueue/set-config': args => {
                        data.update(d => {
                            d.modules.vodQueue.config = {
                                ...d.modules.vodQueue.config,
                                ...args,
                            }
                        })
                        return true
                    },
                    'vodqueue/delete-entry': args => {
                        data.update(d => {
                            d.modules.vodQueue.state.entries = d.modules.vodQueue.state.entries.filter(e => e.id !== args.id)
                        })
                        return true
                    },
                    'vodqueue/mock': args => {
                        data.update(d => {
                            d.modules.vodQueue.state.entries.push({
                                id: generateID(),
                                time: Date.now(),
                                user: { id: '', name: 'Anonymous' },
                                context: generateID(),
                            })
                        })
                        return true
                    },
                    'custommessage/add-message': args => {
                        data.update(d => {
                            d.modules.customMessage.state.messages.push({
                                id: generateID(),
                                emote: null,
                                message: '',
                                visible: false,
                                ...args,
                            })
                        })
                        return true
                    },
                    'custommessage/edit-message': args => {
                        let updated = false
                        data.update(d => {
                            d.modules.customMessage.state.messages = d.modules.customMessage.state.messages.map(m => {
                                if (m.id === args.id) {
                                    updated = true
                                    return {
                                        ...m,
                                        ...args,
                                    }
                                } else {
                                    return m
                                }
                            })
                        })
                        return updated
                    },
                    'custommessage/delete-message': args => {
                        data.update(d => {
                            d.modules.customMessage.state.messages = d.modules.customMessage.state.messages.filter(m => m.id !== args.id)
                        })
                        return true
                    },
                    'counters/set-count': args => {
                        const { id, ...counter } = args
                        data.update(d => {
                            d.modules.counters.state.counters[id] = counter
                        })
                        return true
                    },
                    'counters/add-config': args => {
                        data.update(d => {
                            d.modules.counters.config.configs.push({
                                id: generateID(),
                                redeemID: '',
                                redeemName: '',
                                emote: null,
                                message: 'redeemed',
                                visibility: CounterVisibility.whenRedeemed,
                                duration: 5,
                                maximum: null,
                                ...args,
                            })
                        })
                        return true

                    },
                    'counters/edit-config': args => {
                        let updated = false
                        data.update(d => {
                            d.modules.counters.config.configs = d.modules.counters.config.configs.map(c => {
                                if (c.id === args.id) {
                                    updated = true
                                    return {
                                        ...c,
                                        ...args,
                                    }
                                } else {
                                    return c
                                }
                            })
                        })
                        return updated
                    },
                    'counters/delete-config': args => {
                        data.update(d => {
                            d.modules.counters.config.configs = d.modules.counters.config.configs.filter(c => c.id !== args.id)
                            delete d.modules.counters.state.counters[args.id]
                        })
                        return true
                    },
                    'sounds/remove-redeem': args => {
                        setTimeout(() => {
                            data.update(d => {
                                d.modules.sounds.state.sounds = d.modules.sounds.state.sounds.filter(s => s.id !== args.id)
                            })
                        }, 1000)
                        return true
                    },
                    'sounds/add-config': args => {
                        data.update(d => {
                            d.modules.sounds.config.sounds.push({
                                id: generateID(),
                                redeemID: '',
                                redeemName: '',
                                emote: null,
                                showUsername: true,
                                displayName: '',
                                volume: 1,
                                fileName: '',
                                type: 'one',
                                ...args,
                            })
                        })
                        return true
                    },
                    'sounds/edit-config': args => {
                        let updated = false
                        data.update(d => {
                            d.modules.sounds.config.sounds = d.modules.sounds.config.sounds.map(c => {
                                if (c.id === args.id) {
                                    updated = true
                                    return {
                                        ...c,
                                        ...args,
                                    }
                                } else {
                                    return c
                                }
                            })
                        })
                        return updated
                    },
                    'sounds/delete-config': args => {
                        data.update(d => {
                            d.modules.sounds.config.sounds = d.modules.sounds.config.sounds.filter(c => c.id !== args.id)
                            d.modules.sounds.state.sounds = d.modules.sounds.state.sounds.filter(s => s.configID !== args.id)
                        })
                        return true
                    },
                    'sounds/add-upload': async args => {
                        try {
                            const buffer = Buffer.from(args.data, 'base64')
                            const filePath = `${workingDir}/data/uploads/${name}/${args.fileName}`
                            await fs.mkdir(path.dirname(filePath), { recursive: true })
                            await fs.writeFile(filePath, buffer)
                            data.update(d => {
                                d.modules.sounds.config.uploads.push(args.fileName)
                            })
                            return true
                        } catch (e) {
                            console.error(e)
                            return false
                        }
                    },
                    'sounds/delete-upload': async args => {
                        try {
                            const filePath = `${workingDir}/data/uploads/${name}/${args.fileName}`
                            await fs.unlink(filePath)
                            data.update(d => {
                                d.modules.sounds.config.uploads = d.modules.sounds.config.uploads.filter(s => s !== args.fileName)
                            })
                            return true
                        } catch (e) {
                            console.error(e)
                            return false
                        }
                    },
                    'sounds/mock': args => {
                        data.update(d => {
                            d.modules.sounds.state.sounds.push({
                                id: generateID(),
                                configID: args.configID,
                                userID: '',
                                userName: args.username,
                                redeemTime: Date.now(),
                            })
                        })
                        return true
                    },
                    'vtstudio/complete-model-swap': args => {
                        data.update(d => {
                            d.modules.vtubeStudio.state.swaps = d.modules.vtubeStudio.state.swaps.filter(s => s.id !== args.id)
                        })
                        return true
                    },
                    'vtstudio/add-model-swap': args => {
                        data.update(d => {
                            d.modules.vtubeStudio.config.swaps.push({
                                id: generateID(),
                                redeemID: '',
                                redeemName: '',
                                emote: null,
                                showUsername: false,
                                message: '',
                                duration: 2,
                                type: 'one',
                                models: [],
                                ...args,
                            })
                        })
                        return true
                    },
                    'vtstudio/edit-model-swap': args => {
                        let updated = false
                        data.update(d => {
                            d.modules.vtubeStudio.config.swaps = d.modules.vtubeStudio.config.swaps.map(c => {
                                if (c.id === args.id) {
                                    updated = true
                                    return {
                                        ...c,
                                        ...args,
                                    }
                                } else {
                                    return c
                                }
                            })
                        })
                        return updated
                    },
                    'vtstudio/delete-model-swap': args => {
                        data.update(d => {
                            d.modules.vtubeStudio.config.swaps = d.modules.vtubeStudio.config.swaps.filter(c => c.id !== args.id)
                            d.modules.vtubeStudio.state.swaps = d.modules.vtubeStudio.state.swaps.filter(c => c.configID !== args.id)
                        })
                        return true
                    },
                    'vtstudio/mock-model-swap': args => {
                        data.update(d => {
                            d.modules.vtubeStudio.state.swaps.push({
                                id: generateID(),
                                configID: args.configID,
                                userID: '',
                                userName: 'Anonymous',
                                redeemTime: Date.now(),
                            })
                        })
                        return true
                    },
                    'vtstudio/complete-hotkey-trigger': args => {
                        data.update(d => {
                            d.modules.vtubeStudio.state.triggers = d.modules.vtubeStudio.state.triggers.filter(s => s.id !== args.id)
                        })
                        return true
                    },
                    'vtstudio/add-hotkey-trigger': args => {
                        data.update(d => {
                            d.modules.vtubeStudio.config.triggers.push({
                                id: generateID(),
                                redeemID: '',
                                redeemName: '',
                                emote: null,
                                showUsername: false,
                                message: '',
                                duration: 2,
                                type: 'one',
                                hotkeys: [],
                                ...args,
                            })
                        })
                        return true
                    },
                    'vtstudio/edit-hotkey-trigger': args => {
                        let updated = false
                        data.update(d => {
                            d.modules.vtubeStudio.config.triggers = d.modules.vtubeStudio.config.triggers.map(c => {
                                if (c.id === args.id) {
                                    updated = true
                                    return {
                                        ...c,
                                        ...args,
                                    }
                                } else {
                                    return c
                                }
                            })
                        })
                        return updated
                    },
                    'vtstudio/delete-hotkey-trigger': args => {
                        data.update(d => {
                            d.modules.vtubeStudio.config.triggers = d.modules.vtubeStudio.config.triggers.filter(c => c.id !== args.id)
                            d.modules.vtubeStudio.state.triggers = d.modules.vtubeStudio.state.triggers.filter(c => c.configID !== args.id)
                        })
                        return true
                    },
                    'vtstudio/mock-hotkey-trigger': args => {
                        data.update(d => {
                            d.modules.vtubeStudio.state.triggers.push({
                                id: generateID(),
                                configID: args.configID,
                                userID: '',
                                userName: 'Anonymous',
                                redeemTime: Date.now(),
                            })
                        })
                        return true
                    },
                    'vtstudio/complete-color-tint': args => {
                        data.update(d => {
                            d.modules.vtubeStudio.state.tints = d.modules.vtubeStudio.state.tints.filter(s => s.id !== args.id)
                        })
                        return true
                    },
                    'vtstudio/add-color-tint': args => {
                        data.update(d => {
                            d.modules.vtubeStudio.config.tints.push({
                                id: generateID(),
                                redeemID: '',
                                redeemName: '',
                                emote: null,
                                showUsername: false,
                                message: '',
                                duration: 2,
                                type: 'all',
                                color: { r: 255, g: 255, b: 255, a: 255 },
                                matches: [],
                                rainbowSpeed: 1,
                                ...args,
                            })
                        })
                        return true
                    },
                    'vtstudio/edit-color-tint': args => {
                        let updated = false
                        data.update(d => {
                            d.modules.vtubeStudio.config.tints = d.modules.vtubeStudio.config.tints.map(c => {
                                if (c.id === args.id) {
                                    updated = true
                                    return {
                                        ...c,
                                        ...args,
                                    }
                                } else {
                                    return c
                                }
                            })
                        })
                        return updated
                    },
                    'vtstudio/delete-color-tint': args => {
                        data.update(d => {
                            d.modules.vtubeStudio.config.tints = d.modules.vtubeStudio.config.tints.filter(c => c.id !== args.id)
                            d.modules.vtubeStudio.state.tints = d.modules.vtubeStudio.state.tints.filter(c => c.configID !== args.id)
                        })
                        return true
                    },
                    'vtstudio/mock-color-tint': args => {
                        data.update(d => {
                            d.modules.vtubeStudio.state.tints.push({
                                id: generateID(),
                                configID: args.configID,
                                userID: '',
                                userName: 'Anonymous',
                                redeemTime: Date.now(),
                            })
                        })
                        return true
                    },
                    'vtstudio/edit-config': args => {
                        data.update(d => {
                            d.modules.vtubeStudio.config = {
                                ...d.modules.vtubeStudio.config,
                                ...args,
                            }
                        })
                        return true
                    },
                    'vtstudio/set-status': args => {
                        data.update(d => {
                            d.modules.vtubeStudio.state = {
                                ...d.modules.vtubeStudio.state,
                                status: args,
                            }
                        })
                        return true
                    },
                    'channelinfo/set-config': args => {
                        data.update(d => {
                            d.modules.channelInfo.config = {
                                ...d.modules.channelInfo.config,
                                ...args,
                            }
                        })
                        return true
                    },
                    'channelinfo/get-icons': async args => {
                        return await getAllIcons(client, id, args.forceReload)
                    },
                    'tts/speak': async args => {
                        try {
                            const buffer = await textToSpeech({ id: generateID(), ...args, }, secrets!.azure.speechSubKey, secrets!.azure.speechRegion)
                            const base64 = Buffer.from(buffer).toString('base64')
                            return base64
                        } catch (e) {
                            console.error(e)
                            return ''
                        }
                    },
                    'twitch/rewards': async args => {
                        const rewards = await client.helix.channelPoints.getCustomRewards(id, false)
                        return rewards.map(r => ({ id: r.id, name: r.title }))
                    },
                    'debug/reload': args => {
                        refreshTime = Date.now()
                        return true
                    },
                    'debug/set-config': args => {
                        data.update(d => {
                            d.modules.debug.config = {
                                ...d.modules.debug.config,
                                ...args,
                            }
                        })
                        return true
                    },
                    'config/enable-module': args => {
                        data.update(d => {
                            d.modules[args.type].config.enabled = args.enabled
                        })
                        return true
                    },
                    'access/set': args => {
                        switch (args.userType) {
                            case AccountType.channel:
                                switch (args.targetType) {
                                    case AccountType.bot:
                                        data.update(d => {
                                            d.bots[args.id] = args.access
                                        })
                                        return true
                                    case AccountType.user:
                                        data.update(d => {
                                            d.users[args.id] = args.access
                                        })
                                        return true
                                }
                        }
                        return false
                    }
                }

                const views: ChannelViews = {
                    'access-denied': async (args, msg) => ({
                        ...getChannelViewData(msg),
                        ...args,
                    }),
                    'channel': async (args, msg) => ({
                        ...getChannelViewData(msg),
                        ...args,
                    }),
                    'overlay': async (args, msg) => ({
                        ...getChannelViewData(msg),
                        authToken,
                        ...args,
                    }),
                    'controlpanel-app': async (args, msg) => ({
                        ...getChannelViewData(msg),
                        username: msg.username,
                        modules: data.get(d => d.modules),
                        channels: getChannelsForUser(msg.username).map(c => c.name),
                        botAccess: data.get(d => d.bots),
                        userAccess: data.get(d => d.users),
                        panels: MODULE_TYPES,
                        changelog,
                        ...args,
                    }),
                    'overlay-app': async (args, msg) => ({
                        ...getChannelViewData(msg),
                        modules: data.get(d => d.modules),
                        ...args,
                    }),
                }

                const actionPaths = Object.keys(actions) as (keyof ChannelActions)[]
                for (const path of actionPaths) {
                    router.post(`/actions/${path}/`, async (req, res) => {
                        if (hasAnyTokenAuth(req)) {
                            if (!hasValidTokenAuth(req, authToken)) return respondTokenAuthJSON(res)
                        } else {
                            if (!hasTwitchAuth(req)) return respondTwitchAuthJSON(res)
                            if (!hasChannelAuth(req, name)) return respondChannelAuthJSON(res)
                        }
                        res.type('json').send(JSON.stringify(await actions[path](req.body, getMessage(req, name))))
                    })
                }

                const viewPaths = Object.keys(views) as (keyof ChannelViews)[]
                for (const path of viewPaths) {
                    router.get(`/data/${path}/`, async (req, res) => {
                        if (hasAnyTokenAuth(req)) {
                            if (!hasValidTokenAuth(req, authToken)) return respondTokenAuthJSON(res)
                        } else {
                            if (!hasTwitchAuth(req)) return respondTwitchAuthJSON(res)
                            if (!hasChannelAuth(req, name)) return respondChannelAuthJSON(res)
                        }
                        res.type('json').send(JSON.stringify(await views[path](req.query as any, getMessage(req, name))))
                    })
                }

                router.get('/', async (req, res) => {
                    if (!hasTwitchAuth(req)) return respondTwitchAuthRedirect(res)
                    if (!hasChannelAuth(req, name)) return respondChannelAuthMessage(req, res)
                    await renderChannelView(req, res, 'channel', {})
                })

                router.get('/overlay/', async (req, res) => {
                    await renderChannelView(req, res, 'overlay', {})
                })

                router.get('/sse/', (req, res) => {
                    res.status(200).set({
                        'Cache-Control': 'no-cache',
                        'Content-Type': 'text/event-stream',
                        'Connection': 'keep-alive',
                    })
                    res.flushHeaders()
                    res.socket?.setTimeout(0)

                    res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`)

                    const keepalive = setInterval(() => {
                        res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`)
                    }, 60 * 1000)

                    const handler = (d: ChannelData) => {
                        res.write(`data: ${JSON.stringify({ type: 'refresh' })}\n\n`)
                        return d
                    }
                    data.onWrite(handler)
                    req.on('close', () => {
                        data.offWrite(handler)
                        clearInterval(keepalive)
                    })
                })

                router.use('/uploads/', express.static(`${workingDir}/data/uploads/${name}/`))

                if (!channels[name]) {
                    app.use(`/${name}`, (req, res, next) => {
                        channels[name].router(req, res, next)
                    })
                }

                return channels[name] = {
                    id,
                    name,
                    data,
                    client,
                    pubSubClient,
                    router,
                }
            }
        } catch (e) {
            console.error(`Error setting up channel ${name}:`, e)
        }
        return null
    }

    async function setupUser(name: string): Promise<User | null> {
        const { data, client } = await generateClient(AccountType.user, name)
        try {
            if (data && client) {
                const id = (await client.helix.users.getMe()).id
                return users[name] = {
                    id,
                    name,
                    data,
                    client,
                }
            }
        } catch (e) {
            console.error(`Error setting up user ${name}:`, e)
        }
        return null
    }

    app.use(express.json({ limit: '256mb' }))

    app.set('view engine', 'pug')
    app.set('views', workingDir + '/views/')

    app.use(stylus.middleware({
        src: workingDir + '/styles/src/',
        dest: workingDir + '/styles/out/',
        force: true,
        compress: true,
    }))

    app.get('/favicon.ico', (req, res, next) => {
        if (isGirlDm(getMessage(req, ''))) {
            res.sendFile(workingDir + '/static/favicon-girldm.ico')
            return
        }
        next()
    })

    app.use(express.static(workingDir + '/styles/out/'))
    app.use(express.static(workingDir + '/client/out/'))
    app.use(express.static(workingDir + '/shared/out/'))
    app.use(express.static(workingDir + '/static/'))

    app.get('/ffz/:id/:size', async (req, res) => {
        const url = await getFFZEmoteURL(req.params.id, (safeParseInt(req.params.size) ?? 1) as 1 | 2 | 3)
        res.redirect(301, url)
    })

    app.set('trust proxy', true)
    app.use(session({
        secret: secrets.session.secret,
        cookie: {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        },
        proxy: true,
        name: 'twitchbot.sid',
        resave: false,
        rolling: true,
        saveUninitialized: false,
        store: new SessionStore(),
    }))

    app.use((req, res, next) => {
        if (secrets.local && localLoggedIn && req.session) req.session.twitchUserName = secrets.superUsers[0]
        next()
    })

    app.get('/', (req, res) => {
        renderGlobalView(req, res, 'landing', {})
    })

    app.get('/privacy', (req, res) => {
        res.render('privacy')
    })

    app.get('/tos', (req, res) => {
        res.render('tos')
    })

    app.get('/logout', (req, res) => {
        if (secrets.local) localLoggedIn = false
        req.session?.destroy(err => {
            res.redirect('/')
        })
    })

    app.get('/oauth/discord/', async (req, res) => {
        if (!hasTwitchAuth(req)) {
            return renderGlobalView(req, res, 'message', {
                message: 'Unable to verify your Twitch credentials in order to link your Discord account. :(',
            })
        }
        const redirectUri = `https://${req.hostname}/oauth/discord/`
        const code = String(req.query.code ?? '')

        const request = await fetch(`https://discord.com/api/oauth2/token`, {
            method: 'POST',
            body: new URLSearchParams({
                client_id: secrets.discord.clientID,
                client_secret: secrets.discord.clientSecret,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                code,
                scope: DISCORD_SCOPES.join(' '),
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        })

        const data = await request.json() as DiscordTokenResponse

        const token: DiscordToken = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiration: Date.now() + data.expires_in * 1000,
            scope: data.scope.split(' '),
        }

        const username = req.session.twitchUserName!

        if (channels[username]) {
            channels[username].data.update(d => {
                d.discord = token
            })
        }

        res.status(200)
        renderGlobalView(req, res, 'message', { message: `Successfully linked Discord account!`, redirect: '/' })
    })

    app.get('/authorize/discord/redirect/', (req, res) => {
        if (!hasTwitchAuth(req)) return respondTwitchAuthRedirect(res)
        const redirectUri = encodeURIComponent(`https://${req.hostname}/oauth/discord/`)
        const scopes = encodeURIComponent(DISCORD_SCOPES.join(' '))
        const f = Discord.Permissions.FLAGS
        const permissions = encodeURIComponent([f.ADD_REACTIONS, f.VIEW_CHANNEL, f.SEND_MESSAGES, f.EMBED_LINKS, f.CONNECT, f.USE_VAD, f.CHANGE_NICKNAME, f.USE_EXTERNAL_EMOJIS].reduce((p, c) => p | c))
        const url = `https://discord.com/api/oauth2/authorize?response_type=code&client_id=${secrets.discord.clientID}&scope=${scopes}&redirect_uri=${redirectUri}&prompt=consent&permissions=${permissions}`
        res.redirect(url)
    })

    setupAuthWorkflow(AccountType.bot, BOT_SCOPES)
    setupAuthWorkflow(AccountType.channel, CHANNEL_SCOPES)
    setupAuthWorkflow(AccountType.user, USER_SCOPES)

    const actions: GlobalActions = {
        'access/request': (args, msg) => {
            const user = users[msg.username]
            const channel = channels[args.channel]
            if (!user || !channel) return false
            if (!user.data.get(d => d.channels[args.channel])) {
                user.data.update(d => d.channels[args.channel] = Access.approved)
            }
            if (!channel.data.get(d => d.users[msg.username])) {
                channel.data.update(d => d.users[msg.username] = Access.pending)
            }
            return true
        },
        'access/set': (args, msg) => {
            switch (args.targetType) {
                case AccountType.channel:
                    switch (args.userType) {
                        case AccountType.user:
                            users[msg.username].data.update(d => {
                                d.channels[args.id] = args.access
                            })
                            return true
                        case AccountType.bot:
                            bots[msg.username].data.update(d => {
                                d.channels[args.id] = args.access
                            })
                            return true
                    }
            }
            return false
        },
    }

    const views: GlobalViews = {
        'authorize': async (args, msg) => ({
            ...getGlobalViewData(msg),
            ...args,
        }),
        'message': async (args, msg) => ({
            ...getGlobalViewData(msg),
            ...args,
        }),
        'landing': async (args, msg) => ({
            ...getGlobalViewData(msg),
            ...args,
        }),
        'landing-app': async (args, msg) => {
            const user = users[msg.username]
            const channel = channels[msg.username]
            const bot = bots[msg.username]
            if (user && channel) {
                if (channel.data.get(d => d.users[user.name]) !== Access.approved) {
                    channel.data.update(d => {
                        d.users[user.name] = Access.approved
                    })
                }
                if (user.data.get(d => d.channels[user.name] !== Access.approved)) {
                    user.data.update(d => {
                        d.channels[user.name] = Access.approved
                    })
                }
            }
            if (bot && channel) {
                if (channel.data.get(d => d.bots[bot.name]) !== Access.approved) {
                    channel.data.update(d => {
                        d.bots[bot.name] = Access.approved
                    })
                }
                if (bot.data.get(d => d.channels[bot.name] !== Access.approved)) {
                    bot.data.update(d => {
                        d.channels[bot.name] = Access.approved
                    })
                }
            }
            if (user && secrets.superUsers.includes(msg.username)) {
                for (const channel in channels) {
                    if (user.data.get(d => d.channels[channel] !== Access.approved)) {
                        user.data.update(d => {
                            d.channels[channel] = Access.approved
                        })
                    }
                }
            }
            const superBot = bots[secrets.superBot]
            if (channel && superBot) {
                if (channel.data.get(d => d.bots[superBot.name] !== Access.approved)) {
                    channel.data.update(d => {
                        d.bots[superBot.name] = Access.approved
                    })
                }
                if (superBot.data.get(d => d.channels[channel.name] !== Access.approved)) {
                    superBot.data.update(d => {
                        d.channels[channel.name] = Access.approved
                    })
                }
            }

            let streams: LandingAppViewData['streams'] = []

            try {
                const allStreams = await Promise.all(Object.values(channels).map(c => c.client.helix.streams.getStreamByUserId(c.id)))
                streams = uniqueItems(allStreams.filter(filterFalsy).map(s => ({ channel: s.userDisplayName, game: s.gameName, viewCount: s.viewers })), c => c.channel)
            } catch (e) {
                console.error(e)
            }

            return {
                ...getGlobalViewData(msg),
                ...args,
                username: msg.username,
                userChannelAccess: user ? user.data.get(d => d.channels) : null,
                botChannelAccess: bot ? bot.data.get(d => d.channels) : null,
                changelog,
                streams,
            }
        },
    }

    const actionPaths = Object.keys(actions) as (keyof GlobalActions)[]
    for (const path of actionPaths) {
        app.post(`/actions/${path}/`, async (req, res) => {
            if (!hasTwitchAuth(req)) return respondTwitchAuthJSON(res)
            res.type('json').send(JSON.stringify(await actions[path](req.body, getMessage(req, ''))))
        })
    }

    const viewPaths = Object.keys(views) as (keyof GlobalViews)[]
    for (const path of viewPaths) {
        app.get(`/data/${path}/`, async (req, res) => {
            res.type('json').send(JSON.stringify(await views[path](req.query as any, getMessage(req, ''))))
        })
    }

    app.get('/sse/', (req, res) => {
        res.set({
            'Cache-Control': 'no-cache',
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
        })

        const msg = getMessage(req, '')
        const user = users[msg.username]
        if (!user) {
            res.sendStatus(204)
            return
        }

        res.flushHeaders()
        res.socket?.setTimeout(0)

        res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`)

        const keepalive = setInterval(() => {
            res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`)
        }, 60 * 1000)

        const handler = (d: UserData) => {
            res.write(`data: ${JSON.stringify({ type: 'refresh' })}\n\n`)
            return d
        }
        user.data.onWrite(handler)
        req.on('close', () => {
            user.data.offWrite(handler)
            clearInterval(keepalive)
        })
    })

    const promises: Promise<void>[] = []

    const botNames = (await fs.readdir(workingDir + '/data/bot/')).map(p => path.basename(p, path.extname(p)))
    for (const bot of botNames) {
        promises.push((async () => void await setupBot(bot))())
    }

    const channelNames = (await fs.readdir(workingDir + '/data/channel/')).map(p => path.basename(p, path.extname(p)))
    for (const channel of channelNames) {
        promises.push((async () => void await setupChannel(channel))())
    }

    const userNames = (await fs.readdir(workingDir + '/data/user/')).map(p => path.basename(p, path.extname(p)))
    for (const user of userNames) {
        promises.push((async () => void await setupUser(user))())
    }

    await Promise.all(promises)

    app.listen(60004, () => console.log('Web server running!'))
}

run()
