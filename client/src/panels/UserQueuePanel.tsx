import * as React from 'react'
import { ControlPanelViewData, ControlPanelPage, ModuleDataType } from 'shared'
import { PanelField } from '../controls/PanelField'

export function UserQueuePanel(props: ControlPanelViewData & ModuleDataType<'userQueue'> & { page: ControlPanelPage }) {
    switch (props.page) {
        case ControlPanelPage.view:
            return <>
                <PanelField label="User Count">
                    <input id="user-queue-count" type="number" defaultValue="1" />&nbsp;users
        </PanelField>
                <hr />
                <PanelField>
                    <div id="users">
                        {props.state.entries.length ? props.state.entries.map(e => <div></div>) : <i>No user entries submitted</i>}
                    </div>
                </PanelField>
            </>
        default:
            return <></>
    }
}
