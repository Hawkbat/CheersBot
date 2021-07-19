import * as React from 'react'
import { HexColorInput, RgbaColorPicker } from 'react-colorful'
import { safeParseFloat, safeParseInt } from 'shared'
import { Button } from './Button'

interface Color {
    r: number
    g: number
    b: number
    a: number
}

function hexToColor(v: string): Color {
    const digits = v.substr(1)
    const r = safeParseInt(digits.substr(0, 2), 16) ?? 255
    const g = safeParseInt(digits.substr(2, 2), 16) ?? 255
    const b = safeParseInt(digits.substr(4, 2), 16) ?? 255
    const a = safeParseInt(digits.substr(6, 2), 16) ?? 255
    return { r, g, b, a }
}

function colorToHex(v: Color): string {
    return `#${v.r.toString(16).padStart(2, '0')}${v.g.toString(16).padStart(2, '0')}${v.b.toString(16).padStart(2, '0')}${v.a.toString(16).padStart(2, '0')}`
}

export function ColorPicker(props: { value: Color, onChange: (v: Color) => void }) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState({ ...props.value, a: props.value.a / 255 })

    React.useEffect(() => {
        setValue({ ...props.value, a: props.value.a / 255 })
    }, [colorToHex(props.value)])

    const close = () => {
        props.onChange({ ...value, a: Math.round(value.a * 255) })
        setOpen(false)
    }

    const stopBubble = React.useCallback((e: React.SyntheticEvent) => e.stopPropagation(), [])

    return <>
        <Button onClick={() => setOpen(true)}>
            <div style={{ background: colorToHex(props.value), minWidth: '60px' }}>&nbsp;</div>
        </Button>
        {open ? <div className="ModalOverlay" onClick={close}>
            <div className="Modal ColorPickerWindow" onClick={stopBubble}>
                <RgbaColorPicker color={value} onChange={setValue} />
            </div>
        </div> : <></>}
    </>
}
