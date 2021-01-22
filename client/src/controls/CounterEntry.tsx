import * as React from 'react'
import { Counter, CounterConfig } from 'shared'
import { channelAction } from 'src/utils'
import { Button } from './Button'
import { PanelField } from './PanelField'

export function CounterEntry(props: { config: CounterConfig, value: Counter }): JSX.Element {
    return <div className="QueuedEvent">
        <PanelField>
            <i>{props.config.redeemName}</i>
            <div className="spacer" />
            <span>{props.value.time ? new Date(props.value.time).toLocaleTimeString() : undefined}</span>
        </PanelField>
        <PanelField>
            <span>Count:&nbsp;{props.value.count}{props.config.maximum !== null ? <>&nbsp;/&nbsp;{props.config.maximum}</> : undefined}</span>
            <div className="spacer" />
            <span>
                <Button onClick={e => channelAction('counters/set-count', { id: props.config.id, count: props.value.count + 1, time: Date.now() })}>+1</Button>
                &nbsp;
                <Button onClick={e => channelAction('counters/set-count', { id: props.config.id, count: props.value.count - 1, time: Date.now() })}>-1</Button>
                &nbsp;
                <Button onClick={e => channelAction('counters/set-count', { id: props.config.id, count: 0, time: Date.now() })}>Reset</Button>
            </span>
        </PanelField>
    </div>
}
