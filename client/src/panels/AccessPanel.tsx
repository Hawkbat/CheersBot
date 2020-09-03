import { ChannelData, AccountType, Access, UserData, BotData } from 'shared'
import * as React from 'react'
import { channelAction, globalAction } from '../utils'
import { PanelGroup } from '../controls/PanelGroup'
import { PanelField } from '../controls/PanelField'
import { Dropdown } from '../controls/Dropdown'
import { Button } from '../controls/Button'

async function setAccess(type: AccountType, id: string, access: Access) {
    try {
        if (type === AccountType.channel)
            await globalAction('access/set', { type, id, access })
        else
            await channelAction('access/set', { type, id, access })
    } catch (e) {
        console.error(e)
    }
}

export function AccessPanel(props: { data: ChannelData | UserData | BotData, type: AccountType }) {

    const label = AccountType[props.type].substr(0, 1).toUpperCase() + AccountType[props.type].substr(1)

    let users: { [key: string]: Access }
    switch (props.type) {
        case AccountType.bot:
            users = (props.data as ChannelData).bots
            break
        case AccountType.user:
            users = (props.data as ChannelData).users
            break
        case AccountType.channel:
            users = (props.data as UserData | BotData).channels
            break
    }

    const accessSort = (a: [string, Access], b: [string, Access]): number => {
        const order: Access[] = [Access.approved, Access.pending, Access.denied]
        return Math.sign(order.indexOf(a[1]) - order.indexOf(b[1]))
    }

    const [username, setUsername] = React.useState('')

    return <div className="draggable">
        <PanelGroup label={label + 's'} open={true}>
            {Object.entries(users).sort(accessSort).map(e => <PanelField key={e[0]} label={e[0]}>
                <Dropdown selected={e[1]} options={Object.keys(Access).map(o => ({ value: o, text: o.substr(0, 1).toUpperCase() + o.substr(1) }))} onSelect={async v => await setAccess(AccountType.user, e[0], v as Access)} />
            </PanelField>)}
            <hr />
            <PanelField>
                <Button primary onClick={async () => await setAccess(props.type, username.toLowerCase(), Access.approved)} >Add New {label}</Button>&nbsp;with username&nbsp;<input type="text" defaultValue={username} onChange={e => setUsername(e.target.value)} />
            </PanelField>
        </PanelGroup>
    </div>
}
