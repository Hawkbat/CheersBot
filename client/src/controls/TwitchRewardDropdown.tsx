import * as React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { TwitchReward } from 'shared'
import { channelAction } from '../utils'
import { Dropdown } from './Dropdown'

let runningPromise: Promise<TwitchReward[] | undefined> | null = null

export function TwitchRewardDropdown({
    selectedID,
    selectedName,
    onSelect,
    nullable,
}: {
    selectedID: string,
    selectedName: string,
    onSelect: (id: string, name: string) => void,
    nullable?: boolean,
}) {
    const [rewards, setRewards] = useState<TwitchReward[]>([])

    const doFetch = useCallback(async () => {
        runningPromise = runningPromise ?? channelAction('twitch/rewards', {})
        const results = await runningPromise
        if (results) {
            setRewards(results)
        }
    }, [])

    useEffect(() => {
        doFetch()
    }, [doFetch])

    const options = useMemo(() => rewards.map(r => ({ text: r.name, value: r.id })), [rewards])

    const realSelected = options.find(o => o.value === selectedID)?.value ?? options.find(o => o.text.trim() === selectedName.trim())?.value ?? ''

    return <Dropdown options={options} selected={realSelected} onSelect={v => onSelect(v, options.find(o => o.value === v)?.text ?? '')} nullable={nullable} />
}
