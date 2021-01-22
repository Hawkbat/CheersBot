import * as React from 'react'
import { Counter, CounterConfig } from 'shared'
import { channelAction } from 'src/utils'
import { Button } from './Button'
import { PanelField } from './PanelField'

export function CounterEntry(props: { config: CounterConfig, value: Counter }): JSX.Element {
    const [override, setOverride] = React.useState(0)
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
                <input type="number" value={override} onChange={e => setOverride(parseInt(e.target.value))} />
                &nbsp;
                <Button primary onClick={e => channelAction('counters/set-count', { id: props.config.id, count: override ?? 0, time: Date.now() })}>Set</Button>
                &nbsp;
                <Button onClick={e => channelAction('counters/set-count', { id: props.config.id, count: props.value.count + 1, time: Date.now() })}>+1</Button>
                &nbsp;
                <Button onClick={e => channelAction('counters/set-count', { id: props.config.id, count: props.value.count - 1, time: Date.now() })}>-1</Button>
            </span>
        </PanelField>
    </div>
}
