import React from 'react'
import { safeParseFloat } from 'shared'

export function DurationInput(props: { value: number, readOnly?: boolean, disabled?: boolean, onChange?: (value: number) => void }) {

    const hours = Math.floor(props.value / (60 * 60 * 1000))
    const minutes = Math.floor((props.value - hours * 60 * 60 * 1000) / (60 * 1000))
    const seconds = (props.value - hours * 60 * 60 * 1000 - minutes * 60 * 1000) / 1000

    const setHours = (hours: number | null) => hours !== null ? props.onChange?.((hours * 60 * 60 + minutes * 60 + seconds) * 1000) : void 0

    const setMinutes = (minutes: number | null) => minutes !== null ? props.onChange?.((hours * 60 * 60 + minutes * 60 + seconds) * 1000) : void 0

    const setSeconds = (seconds: number | null) => seconds !== null ? props.onChange?.((hours * 60 * 60 + minutes * 60 + seconds) * 1000) : void 0

    return <>
        <input type='number' readOnly={props.readOnly} disabled={props.disabled} step='any' min={0} value={hours} onChange={e => setHours(safeParseFloat(e.target.value))} />h&nbsp;
        <input type='number' readOnly={props.readOnly} disabled={props.disabled} step='any' min={0} value={minutes} onChange={e => setMinutes(safeParseFloat(e.target.value))} />m&nbsp;
        <input type='number' readOnly={props.readOnly} disabled={props.disabled} step='any' min={0} value={seconds} onChange={e => setSeconds(safeParseFloat(e.target.value))} />s
    </>
}
