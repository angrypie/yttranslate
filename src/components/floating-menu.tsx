import { Affix, Button, Modal, Select, Text } from '@mantine/core'
import { IconLanguage } from '@tabler/icons'
import { useRecoilState, useRecoilValue } from 'recoil'
import { ytplayerTime } from 'store/player'
import React from 'react'
import { userConfig } from 'store/user'

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
	const [opened, setOpened] = React.useState(false)

	console.log('DEV_INFO ROOT RE-RENDER')
	return (
		<>
			<Modal opened={opened} onClose={() => setOpened(false)} title='Settings'>
				<UserSettingsForm />
			</Modal>
			<Button
				color='pink'
				onClick={() => setOpened(true)}
				leftIcon={<IconLanguage size={16} />}
			>
				Settings ({<PlayerTime />}s)
			</Button>
		</>
	)
}

function UserSettingsForm() {
	const [userSettings, setUserSettings] = useRecoilState(userConfig)
	const [targetLanguage, setTargetLanguage] = React.useState<string | null>(
		userSettings.targetLanguage
	)

	const clearDictionary = () => {
		if (confirm('are you sure you want to exit?')) {
			clearDictionary()
		}
	}

	const changeUserSettings = () => {
		if (targetLanguage !== null) {
			setUserSettings(old => ({ ...old, targetLanguage }))
		}
	}

	return (
		<>
			<Select
				label='Target Language'
				placeholder='Select language'
				value={targetLanguage}
				onChange={setTargetLanguage}
				data={[
					{ value: 'pt-PT', label: 'Portuguese' },
					{ value: 'en-US', label: 'English' },
					{ value: 'ru-RU', label: 'Russian' },
				]}
			/>
			<br />
			<Button color='green' onClick={changeUserSettings}>
				Change User Settings
			</Button>
			<br />
			<br />
			<Button color='red' onClick={clearDictionary}>
				Clear Dictionary
			</Button>
		</>
	)
}

function PlayerTime() {
	const time = useRecoilValue(ytplayerTime)
	return <Text>{time.toFixed()}</Text>
}
