import { AccountType, Access, AccessMap } from 'shared'
import * as React from 'react'
import { channelAction, globalAction } from '../utils'
import { PanelGroup } from '../controls/PanelGroup'
import { PanelField } from '../controls/PanelField'
import { Dropdown } from '../controls/Dropdown'
import { Button } from '../controls/Button'

async function setAccess(userType: AccountType, targetType: AccountType, id: string, access: Access) {
    try {
        if (targetType === AccountType.channel)
            await globalAction('access/set', { userType, targetType, id, access })
        else
            await channelAction('access/set', { userType, targetType, id, access })
    } catch (e) {
        console.error(e)
    }
}

export function AccessPanel(props: { access: AccessMap, userType: AccountType, targetType: AccountType }) {

    const targetLabel = AccountType[props.targetType].substr(0, 1).toUpperCase() + AccountType[props.targetType].substr(1)
    const userLabel = AccountType[props.userType].substr(0, 1).toUpperCase() + AccountType[props.userType].substr(1)

    const accessSort = (a: [string, Access], b: [string, Access]): number => {
        const order: Access[] = [Access.approved, Access.pending, Access.denied]
        return Math.sign(order.indexOf(a[1]) - order.indexOf(b[1]))
    }

    const [username, setUsername] = React.useState('')

    return <div className="draggable">
        <PanelGroup label={`${targetLabel} Access to this ${userLabel}`} open={true}>
            {Object.entries(props.access).sort(accessSort).map(e => <PanelField key={e[0]} label={e[0]}>
                <Dropdown selected={e[1]} options={Object.keys(Access).map(o => ({ value: o, text: o.substr(0, 1).toUpperCase() + o.substr(1) }))} onSelect={async v => await setAccess(props.userType, props.targetType, e[0], v as Access)} />
            </PanelField>)}
            <hr />
            <PanelField>
                <Button primary onClick={async () => await setAccess(props.userType, props.targetType, username.toLowerCase(), Access.approved)} >Add New {targetLabel}</Button>&nbsp;with username&nbsp;<input type="text" defaultValue={username} onChange={e => setUsername(e.target.value)} />
            </PanelField>
        </PanelGroup>
    </div>
}
