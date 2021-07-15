import * as React from 'react'
import { Failure } from './Failure'
import { Info } from './Info'
import { Success } from './Success'
import { Warning } from './Warning'

export function Alert(props: { type: 'info' | 'warn' | 'fail' | 'success', tooltip?: string, children?: React.ReactNode }) {
    switch (props.type) {
        case 'info': return <div className="Alert"><Info tooltip={props.tooltip ?? ''} />{props.children}</div>
        case 'warn': return <div className="Alert"><Warning tooltip={props.tooltip ?? ''} />{props.children}</div>
        case 'fail': return <div className="Alert"><Failure tooltip={props.tooltip ?? ''} />{props.children}</div>
        case 'success': return <div className="Alert"><Success tooltip={props.tooltip ?? ''} />{props.children}</div>
    }
}
