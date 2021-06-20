import * as React from 'react'
import { createContext, useCallback, useState } from 'react'
import { Icon } from './Icon'

interface InfoPopupContext {
    show: (title: string, text: string) => void
}

export const infoPopupContext = createContext<InfoPopupContext>(null as any)

export function InfoPopupProvider(props: { children: React.ReactNode }) {
    const [state, setState] = useState({
        open: false,
        title: '',
        text: '',
    })
    const hide = useCallback(() => setState({
        open: false,
        title: '',
        text: '',
    }), [])
    const show = useCallback((title: string, text: string) => setState({
        open: true,
        title,
        text,
    }), [])
    const stopBubble = useCallback((e: React.SyntheticEvent) => e.stopPropagation(), [])

    return <infoPopupContext.Provider value={{ show }}>
        {props.children}
        {state.open ? <div className="ModalOverlay" onClick={hide}>
            <div className="Modal InfoPopup" onClick={stopBubble}>
                <h1>{state.title}</h1>
                <span className="ModalCloser" onClick={hide}><Icon icon="times" fixedWidth /></span>
                <aside>{state.text}</aside>
            </div>
        </div> : <></>}
    </infoPopupContext.Provider>
}
