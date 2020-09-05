import { RedeemMode, Icon, generateID, Store, mergePartials, AccountType, BotData, ChannelData, UserData, Token, AccountData, ChannelActions, ChannelViews, MODULE_TYPES, Access, GlobalActions, GlobalViews, MessageMeta, parseJSON } from 'shared'
import TwitchClient from 'twitch'
import ChatClient, { PrivateMessage, LogLevel } from 'twitch-chat-client'
import PubSubClient from 'twitch-pubsub-client'
import WebHookClient, { ReverseProxyAdapter } from 'twitch-webhooks'
import * as express from 'express'
import * as session from 'express-session'
import * as stylus from 'stylus'
import * as fs from 'fs'
import * as path from 'path'
import { readJSON, writeJSON } from './utils'
import { SessionStore } from './sessionStore'
import fetch from 'node-fetch'
import { getDisplayModes, REDEEM_TYPES, removeModeDelayed, addModeDelayed, EVIL_PATTERN } from './girldm'
import { Bot, Channel, User, Secrets } from './data'
import { getTwitchEmotes, getTwitchBadges } from './twitchemotes'
import expressWs = require('express-ws')
import WebSocket = require('ws')

const workingDir = process.cwd()

async function run() {
    const secrets = await readJSON<Secrets>(workingDir + '/secrets.json')
    if (!secrets) throw new Error('secrets.json is missing or incorrectly formatted; app cannot be initialized')

    const CLIENT_ID = secrets.twitch.clientID
    const CLIENT_SECRET = secrets.twitch.clientSecret

    const BOT_SCOPES = ['chat:read', 'chat:edit']
    const CHANNEL_SCOPES = ['moderation:read', 'channel:moderate', 'channel:read:redemptions', 'channel:read:subscriptions']
    const USER_SCOPES = ['user:read:email']

    const BAN_TIMEOUT = 10 * 60 * 1000

    const refreshTime = Date.now()

    let bots: { [key: string]: Bot } = {}
    let channels: { [key: string]: Channel } = {}
    let users: { [key: string]: User } = {}

    const app = express()
    const wsApp = expressWs(app)

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
        return getUsersForChannel(channel).some(u => u.name === req.session?.twitchUserName)
    }

    function respondChannelAuthMessage(res: express.Response): void {
        res.status(403).render('message', { message: `You don't have access to this channel!` })
    }

    function respondChannelAuthJSON(res: express.Response): void {
        res.status(403).type('json').send('' + JSON.stringify({ status: 403, error: `You don't have access to this channel!` }))
    }

    function getMessage(req: express.Request): MessageMeta {
        return {
            id: generateID(),
            username: req.session?.twitchUserName ?? '',
            channel: /^\/(\w+)\//.exec(req.path)?.[1] ?? '',
        }
    }

    function getTokenPath(accountType: AccountType, userName: string): string {
        return workingDir + `/data/${accountType}/${userName}.json`
    }

    function getDefaultData(accountType: AccountType.bot): BotData
    function getDefaultData(accountType: AccountType.channel): ChannelData
    function getDefaultData(accountType: AccountType.user): UserData
    function getDefaultData(accountType: AccountType, token?: Token): AccountData
    function getDefaultData(accountType: AccountType, token?: Token): AccountData {
        if (!token) token = { accessToken: '', refreshToken: '', scope: [] }
        const DEFAULT_DATA_CHANNEL: ChannelData = {
            token,
            bots: {},
            users: {},
            modules: {
                headpats: {
                    config: {
                        enabled: false,
                    },
                    state: {
                        count: 0,
                        streak: 0,
                    },
                },
                evilDm: {
                    config: {
                        enabled: false,
                    },
                    state: {
                        count: 0,
                        time: 0,
                    },
                },
                modeQueue: {
                    config: {
                        enabled: false,
                    },
                    state: {
                        modes: [],
                    },
                },
                winLoss: {
                    config: {
                        enabled: false,
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
                backdrop: {
                    config: {
                        enabled: false,
                    },
                    state: {

                    },
                },
                channelInfo: {
                    config: {
                        enabled: true,
                    },
                    state: {

                    },
                },
                debug: {
                    config: {
                        enabled: false,
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
        const redirectUri = `https://girldm.hawk.bar/oauth/${accountType}/`

        app.get(`/oauth/${accountType}/`, async (req, res) => {
            try {
                const code = req.query.code

                const result = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=${redirectUri}`, { method: 'POST' })
                const data = await result.json()

                const token: Token = {
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
                res.status(200).render('message', { message: `Successfully logged in!`, redirect: '/' })
            } catch (e) {
                console.error(`Error registering: `, e)
                res.status(500).render('message', { message: `We weren't able to log you in :( Let Hawkbar know the bot is broken!` })
            }
        })

        app.get(`/authorize/${accountType}/`, (req, res) => {
            res.render('authorize', { accountType })
        })

        app.get(`/authorize/${accountType}/redirect/`, (req, res) => {
            const url = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${accessScopes.join('+')}`
            res.redirect(url)
        })
    }

    async function generateClient(accountType: AccountType.bot, userName: string): Promise<{ data: Store<BotData> | null, client: TwitchClient | null }>
    async function generateClient(accountType: AccountType.channel, userName: string): Promise<{ data: Store<ChannelData> | null, client: TwitchClient | null }>
    async function generateClient(accountType: AccountType.user, userName: string): Promise<{ data: Store<UserData> | null, client: TwitchClient | null }>
    async function generateClient(accountType: AccountType, token: Token): Promise<{ data: Store<AccountData> | null, client: TwitchClient | null }>
    async function generateClient<T extends AccountData>(accountType: AccountType, userNameOrToken: string | Token): Promise<{ data: Store<T> | null, client: TwitchClient | null }> {
        let userName: string = ''
        let tokenPath: string = ''
        let token: Token
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

            const client = TwitchClient.withCredentials(CLIENT_ID, token.accessToken, token.scope, {
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
            }, { preAuth: true })

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

    function getChannelsForBot(bot: string): Channel[] {
        const b = bots[bot]
        return b ? Object.values(channels).filter(c => c.data.get(d => d.users[b.name] === Access.approved) && b.data.get(d => d.channels[c.name] === Access.approved)) : []
    }

    function getUsersForChannel(channel: string): User[] {
        const c = channels[channel]
        return c ? Object.values(users).filter(u => u.data.get(d => d.channels[c.name] === Access.approved) && c.data.get(d => d.users[u.name] === Access.approved)) : []
    }

    function getChannelsForUser(user: string): Channel[] {
        const u = users[user]
        return u ? Object.values(channels).filter(c => c.data.get(d => d.users[u.name] === Access.approved) && u.data.get(d => d.channels[c.name] === Access.approved)) : []
    }

    async function setupBot(name: string): Promise<Bot | null> {
        const { data, client } = await generateClient(AccountType.bot, name)
        try {
            if (data && client) {
                const id = (await client.helix.users.getMe()).id

                const chatChannels = data.get(d => Object.keys(d.channels).filter(c => d.channels[c] === Access.approved))
                const chatClient = new ChatClient(client, { channels: chatChannels, requestMembershipEvents: true })
                await chatClient.connect()

                chatClient.onPrivmsg(async (channel: string, user: string, message: string, msg: PrivateMessage) => {
                    const c = channels[channel.substr(1)]
                    if (!c) return
                    const isUser = getUsersForChannel(c.name).some(u => u.name === user) || msg.userInfo.isBroadcaster || msg.userInfo.isMod
                    if (isUser) {
                        const parts = message.split(/\b/g).map(p => p.trim()).filter(p => p.length)
                        const prefix = parts.shift()
                        const command = parts.shift()
                        const args = parts

                        switch (prefix) {
                            case 'girldmCheer':
                                switch (command) {
                                    case undefined:
                                        chatClient?.say(channel, 'girldmCheer girldmCheer girldmCheer girldmCheer')
                                        break
                                }
                                break
                            case '$':
                                switch (command) {
                                    case 'win':
                                        c.data.update(d => {
                                            d.modules.winLoss.state.wins++
                                        })
                                        break
                                    case 'loss':
                                        c.data.update(d => {
                                            d.modules.winLoss.state.losses++
                                        })
                                        break
                                    case 'draw':
                                        c.data.update(d => {
                                            d.modules.winLoss.state.draws++
                                        })
                                        break
                                    case 'death':
                                        c.data.update(d => {
                                            d.modules.winLoss.state.deaths++
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
                    }
                })

                return bots[name] = {
                    id,
                    name,
                    data,
                    client,
                    chatClient
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
                let refreshTime = Date.now()

                const id = (await client.helix.users.getMe()).id

                const router = express.Router()
                router.use(express.json())

                const sockets: WebSocket[] = []

                const icons: Icon[] = []
                icons.push(...await getTwitchEmotes(id))
                icons.push(...await getTwitchBadges(id))
                icons.push(...await getTwitchEmotes('0'))
                icons.push(...await getTwitchBadges('0'))

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
                                        bot.chatClient.action(name, 'Out of headpats because dm is dented! girldmHeadpat girldmHeadpat girldmHeadpat girldmHeadpat')
                                    }
                                }
                                break
                            case 'girldm heccin ban me':
                                addModeDelayed(data, {
                                    id: generateID(),
                                    type: 'girldm heccin ban me',
                                    userID: msg.userId,
                                    userName: msg.userDisplayName,
                                    message: '',
                                    amount: 1,
                                    redeemTime: Date.now(),
                                    visible: true,
                                })
                                break
                            case '10 minutes nyan nyan dm~':
                                addModeDelayed(data, {
                                    id: generateID(),
                                    type: '10 minutes nyan nyan dm~',
                                    userID: msg.userId,
                                    userName: msg.userDisplayName,
                                    message: '',
                                    amount: 1,
                                    redeemTime: Date.now(),
                                    visible: true,
                                })
                                break
                            case 'GIRLDM JAPANESE MODE ACTIVATE':
                                addModeDelayed(data, {
                                    id: generateID(),
                                    type: 'GIRLDM JAPANESE MODE ACTIVATE',
                                    userID: msg.userId,
                                    userName: msg.userDisplayName,
                                    message: '',
                                    amount: 1,
                                    redeemTime: Date.now(),
                                    visible: true,
                                })
                                break
                            case 'girldm say something!!':
                                if (EVIL_PATTERN.test(msg.message)) {
                                    data.update(d => {
                                        d.modules.evilDm.state.count++
                                        d.modules.evilDm.state.time = Date.now()
                                    })
                                } else {
                                    console.log(msg)
                                }
                                break
                            default:
                                console.log(msg)
                                break
                        }
                    })
                }

                if (data.get(d => d.token.scope.includes('channel:moderate'))) {
                    pubSubClient.onModAction(id, id, msg => {
                        if (msg.action === 'timeout') {
                            const username = msg.args[0]
                            const duration = parseFloat(msg.args[1])
                            const ban = data.get(d => d.modules.modeQueue.state.modes).find(b => b.type === 'girldm heccin ban me' && b.userName.toLowerCase() === username.toLowerCase())
                            if (ban) {
                                ban.startTime = Date.now()
                                ban.duration = BAN_TIMEOUT
                                for (const bot of getBotsForChannel(name)) {
                                    bot.chatClient.action(name, `Goodbye, @${username}! Have a nice heccin time while being banned girldmCheer`)
                                }
                            }
                        } else if (msg.action === 'untimeout') {
                            const username = msg.args[0]
                            const ban = data.get(d => d.modules.modeQueue.state.modes).find(b => b.type === 'girldm heccin ban me' && b.userName.toLowerCase() === username.toLowerCase())
                            if (ban) {
                                for (const bot of getBotsForChannel(name)) {
                                    bot.chatClient.action(name, `Welcome back, @${username}! girldmCheer`)
                                }
                                removeModeDelayed(data, ban)
                            }
                        }
                    })
                }

                const webHookClient = new WebHookClient(client, new ReverseProxyAdapter({
                    hostName: 'girldm.hawk.bar',
                    pathPrefix: `/${name}/hooks`,
                    listenerPort: 60004,
                    port: 443,
                    ssl: true,
                }), { logger: { minLevel: LogLevel.TRACE } })

                await webHookClient.subscribeToFollowsToUser('71092938', follow => {
                    console.log(`${follow.userDisplayName} is following ${name}`)
                })

                if (data.get(d => d.token.scope.includes('channel:read:subscriptions'))) {
                    await webHookClient.subscribeToSubscriptionEvents(id, sub => {
                        console.log(`${sub.userDisplayName} subscribed to ${name}`)
                    })
                }

                const actions: ChannelActions = {
                    'headpats/adjust': args => {
                        data.update(d => {
                            d.modules.headpats.state.count += args.delta
                            if (args.delta > 0) d.modules.headpats.state.streak += args.delta
                        })
                        if (data.get(d => d.modules.headpats.state.count) === 0 && data.get(d => d.modules.headpats.state.streak) > 1) {
                            for (const bot of getBotsForChannel(name)) {
                                bot.chatClient.action(name, `${data.get(d => d.modules.headpats.state.streak)} headpat streak! girldmCheer girldmCheer girldmCheer girldmHeadpat girldmHeadpat girldmHeadpat`)
                            }
                            data.update(d => {
                                d.modules.headpats.state.streak = 0
                            })
                        }
                        return true
                    },
                    'evildm/adjust': args => {
                        data.update(d => {
                            d.modules.evilDm.state.count += args.delta
                            d.modules.evilDm.state.time = Date.now()
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
                                }
                            })
                        }
                        return true
                    },
                    'modequeue/clear': args => {
                        const mode = data.get(d => d.modules.modeQueue.state.modes.find(m => m.id === args.id))
                        if (mode) {
                            removeModeDelayed(data, mode)
                        }
                        return true
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
                    'backdrop/fire-cannon': args => {
                        return true
                    },
                    'backdrop/swap-camera': args => {
                        return true
                    },
                    'debug/mock': args => {
                        if (args.type === 'girldm say something!!') {
                            if (EVIL_PATTERN.test(args.message)) {
                                data.update(d => {
                                    d.modules.evilDm.state.count++
                                    d.modules.evilDm.state.time = Date.now()
                                })
                            }
                        } else {
                            const mode: RedeemMode = {
                                id: generateID(),
                                type: args.type,
                                userID: '',
                                userName: args.username,
                                message: args.message,
                                amount: args.amount,
                                redeemTime: Date.now(),
                                visible: true,
                            }
                            addModeDelayed(data, mode)
                        }
                        return true
                    },
                    'debug/reload': args => {
                        refreshTime = Date.now()
                        return true
                    },
                    'config/enable-module': args => {
                        data.update(d => {
                            d.modules[args.type].config.enabled = args.enabled
                        })
                        return true
                    },
                    'access/set': args => {
                        switch (args.type) {
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
                            default:
                                return false
                        }
                    }
                }

                const views: ChannelViews = {
                    'controlpanel': msg => ({
                        username: msg.username,
                        channel: name,
                        channelData: data.get(d => d),
                        channels: getChannelsForUser(msg.username).map(c => c.name),
                        redeemTypes: REDEEM_TYPES,
                        icons,
                        panels: MODULE_TYPES.map(type => ({ type, open: true })),
                        refreshTime,
                        updateTime: new Date(),
                    }),
                    'overlay': () => ({
                        channel: name,
                        channelData: data.get(d => d),
                        modes: getDisplayModes(data.get(d => d.modules.modeQueue.state.modes)),
                        refreshTime,
                    }),
                }

                const actionPaths = Object.keys(actions) as (keyof ChannelActions)[]
                for (const path of actionPaths) {
                    router.post(`/actions/${path}/`, async (req, res) => {
                        if (!hasTwitchAuth(req)) return respondTwitchAuthJSON(res)
                        if (!hasChannelAuth(req, name)) return respondChannelAuthJSON(res)
                        res.type('json').send(JSON.stringify(actions[path](req.body, getMessage(req))))
                    })
                }

                const viewPaths = Object.keys(views) as (keyof ChannelViews)[]
                for (const path of viewPaths) {
                    router.get(`/data/${path}/`, async (req, res) => {
                        res.type('json').send(JSON.stringify(views[path](getMessage(req))))
                    })
                }

                router.get('/', (req, res) => {
                    if (!hasTwitchAuth(req)) return respondTwitchAuthRedirect(res)
                    if (!hasChannelAuth(req, name)) return respondChannelAuthMessage(res)
                    res.render('channel', views.controlpanel(getMessage(req)))
                })

                router.get('/overlay/', (req, res) => {
                    res.render('overlay', views.overlay(getMessage(req)))
                })

                router.ws('/ws/', (ws, req) => {
                    sockets.push(ws)
                    ws.on('message', msg => {
                        console.log(`[${name}] msg: ${msg}`)
                        parseJSON(msg.toString())

                    })
                    console.log(`[${name}] sock: ${req.header('forwarded') ?? req.header('x-forwarded-for') ?? req.header('true-client-ip') ?? req.ip}`)
                })

                if (!channels[name]) {
                    app.use(`/${name}`, (req, res, next) => {
                        channels[name].router(req, res, next)
                    })
                }

                webHookClient.applyMiddleware(router)

                return channels[name] = {
                    id,
                    name,
                    data,
                    client,
                    pubSubClient,
                    webHookClient,
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

    app.use(express.json())

    app.set('view engine', 'pug')
    app.set('views', workingDir + '/views/')

    app.use(stylus.middleware({
        src: workingDir + '/styles/src/',
        dest: workingDir + '/styles/out/',
        force: true,
        compress: true,
    }))

    app.use(express.static(workingDir + '/styles/out/'))
    app.use(express.static(workingDir + '/client/out/'))
    app.use(express.static(workingDir + '/shared/out/'))
    app.use(express.static(workingDir + '/static/'))

    app.set('trust proxy', 1)
    app.use(session({
        secret: secrets.session.secret,
        cookie: {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        },
        proxy: true,
        name: 'twitchbot.sid',
        resave: false,
        rolling: true,
        saveUninitialized: false,
        store: new SessionStore(),
    }))

    app.get('/', (req, res) => {
        res.render('landing', views.landing(getMessage(req)))
    })

    app.get('/overlay/', (req, res) => {
        res.render('message', { message: 'This is the wrong URL for the Cheers Bot overlay! Copy the URL from your channel\'s Cheers Bot control panel!' })
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
            switch (args.type) {
                case AccountType.channel:
                    users[msg.username].data.update(d => {
                        d.channels[args.id] = args.access
                    })
                    return true
                default:
                    return false
            }
        },
    }

    const views: GlobalViews = {
        'landing': msg => {
            const user = users[msg.username]
            return {
                username: msg.username,
                userData: user ? user.data.get(d => d) : null,
                refreshTime,
            }
        }
    }

    const actionPaths = Object.keys(actions) as (keyof GlobalActions)[]
    for (const path of actionPaths) {
        app.post(`/actions/${path}/`, async (req, res) => {
            if (!hasTwitchAuth(req)) return respondTwitchAuthJSON(res)
            if (!hasChannelAuth(req, name)) return respondChannelAuthJSON(res)
            res.type('json').send(JSON.stringify(actions[path](req.body, getMessage(req))))
        })
    }

    const viewPaths = Object.keys(views) as (keyof GlobalViews)[]
    for (const path of viewPaths) {
        app.get(`/data/${path}/`, async (req, res) => {
            res.type('json').send(JSON.stringify(views[path](getMessage(req))))
        })
    }

    const promises: Promise<void>[] = []

    const botNames = fs.readdirSync(workingDir + '/data/bot/').map(p => path.basename(p, path.extname(p)))
    for (const bot of botNames) {
        promises.push((async () => void await setupBot(bot))())
    }

    const channelNames = fs.readdirSync(workingDir + '/data/channel/').map(p => path.basename(p, path.extname(p)))
    for (const channel of channelNames) {
        promises.push((async () => void await setupChannel(channel))())
    }

    const userNames = fs.readdirSync(workingDir + '/data/user/').map(p => path.basename(p, path.extname(p)))
    for (const user of userNames) {
        promises.push((async () => void await setupUser(user))())
    }

    await Promise.all(promises)

    app.listen(60004, () => console.log('Web server running!'))
}

run()
