
export interface DiscordTokenResponse {
    access_token: string
    token_type: 'bearer'
    expires_in: number
    refresh_token: string
    scope: string
    guild?: {
        id: string
        owner_id: string
    }
}


