import * as React from 'react'
import { ControlPanelAppViewData, ControlPanelPage, logError, ModuleDataType, PanelViewDataProps } from 'shared'
import { PanelField } from '../controls/PanelField'
import { channelAction } from '../utils'
import { Button } from '../controls/Button'

export function BackdropPanel(props: ControlPanelAppViewData & ModuleDataType<'backdrop'> & PanelViewDataProps) {
    const [cannonText, setCannonText] = React.useState('')

    const swapCamera = async (name: string) => {
        try {
            await channelAction('backdrop/swap-camera', { name })
        } catch (e) {
            logError(CHANNEL_NAME, 'backdrop', e)
        }
    }

    const fireCannon = async () => {
        try {
            setCannonText('')
            await channelAction('backdrop/fire-cannon', { text: cannonText })
        } catch (e) {
            logError(CHANNEL_NAME, 'backdrop', e)
        }
    }

    switch (props.page) {
        case ControlPanelPage.view:
            return <>
                <PanelField label="Cameras">
                    <Button primary onClick={e => swapCamera('Home')}>Home</Button>
                    <Button onClick={e => swapCamera('Screen')}>Screen</Button>
                </PanelField>
                <PanelField label="Cannon Text">
                    <input type="text" value={cannonText} onChange={e => setCannonText(e.target.value)} />
                </PanelField>
                <PanelField>
                    <Button onClick={e => fireCannon()}>Fire Cannon</Button>
                </PanelField>
            </>
        default:
            return <></>
    }
}
