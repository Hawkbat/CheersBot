import { Icon } from 'shared'
import * as React from 'react'
import { ExternalIcon } from './ExternalIcon'

export function ExternalIconButton(props: { icon: Icon, size: 1 | 2 | 3, onClick: () => void }) {
    return <div className='ExternalIconButton' onClick={props.onClick}>
        <ExternalIcon icon={props.icon} size={props.size} />
    </div>
}
