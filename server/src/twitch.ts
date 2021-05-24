
export interface TwitchTokenResponse {
    access_token: string
    refresh_token: string
    expires_in: number
    scope: string[]
    token_type: 'bearer'
}
