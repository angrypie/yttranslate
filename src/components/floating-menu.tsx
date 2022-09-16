import { IconLanguage } from '@tabler/icons'
import { Affix, Button, Text } from '@mantine/core'
import { useRecoilValue } from 'recoil'
import { Space } from 'components/text'
import { ytplayer, ytplayerTime } from 'store/player'
import React from 'react'
import { clearDictionary } from 'lib/dictionary'
import {userConfig} from 'store/user'

export function FloatMenu() {
	return (
		<Affix position={{ bottom: 20, right: 20 }}>
			<React.Suspense fallback={<div>Loading...</div>}>
				<MenuButton />
			</React.Suspense>
		</Affix>
	)
}

//MuneButton waits for player to be loaded
const MenuButton = () => {
	const player = useRecoilValue(ytplayer)
	const user = useRecoilValue(userConfig)

	const onClick = () => {
		if (confirm('are you sure you want to exit?')) {
			clearDictionary()
		}
	}

	//TODO player paused on first page load - remove in production
	React.useEffect(() => {
		player.setCaptionsLanguage(user.targetLanguage)
		setTimeout(() => {
			player.pauseVideo()
		}, 2000)
	}, [])
	console.log('DEV_INFO ROOT RE-RENDER')
	return (
		<>
			<Button
				color='pink'
				onClick={onClick}
				leftIcon={<IconLanguage size={16} />}
			>
				Clean dictionary <Space /> <PlayerTime />
			</Button>
		</>
	)
}

const PlayerTime = () => {
	const time = useRecoilValue(ytplayerTime)
	return <Text>{time.toFixed()}s</Text>
}
