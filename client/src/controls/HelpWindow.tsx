import * as React from 'react'
import { Icon } from './Icon'

export function HelpWindow() {
    const [visible, setVisible] = React.useState(false)

    const onOpen = () => setVisible(true)

    const onClose = () => setVisible(false)

    const stopBubble = (e: React.SyntheticEvent) => e.stopPropagation()

    return <>
        <div className="HelpWindowOpener" onClick={onOpen}>
            <Icon icon="question-circle" />&nbsp;
            <span>Need Help?</span>
        </div>
        {visible ? <div className="ModalOverlay" onClick={onClose}>
            <div className="Modal HelpWindow" onClick={stopBubble}>
                <h1>Need Help?</h1>
                <span className="ModalCloser" onClick={onClose}><Icon icon="times" fixedWidth /></span>
                <aside>Run into issues? Need questions answered? Try one of these options:</aside>
                <ul>
                    <li>Read the <a href="/faq" target="_blank">Frequently Asked Questions</a> page</li>
                    <li>Watch a setup video on <a href="https://www.youtube.com/playlist?list=PLgd4eEt2uLUxlHSnOGSdtCU_6i_RpQuGx" target="_blank">Hawkbar's YouTube channel</a></li>
                    <li>Ask for help in the cheers bot help channel in <a href="https://discord.gg/ShtHbSme6w" target="_blank">Hawkbar's Discord</a></li>
                    <li>Directly <a href="https://twitter.com/messages/compose?recipient_id=1129224376421900288" target="_blank">message Hawkbar</a> on Twitter</li>
                </ul>
            </div>
        </div> : <></>}
    </>
}
