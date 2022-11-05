import { Affix, Button, Modal, Select } from '@mantine/core'
import { IconLanguage } from '@tabler/icons'
import { useRecoilState } from 'recoil'
import React from 'react'
import { userConfig } from 'store/user'
import { clearDictionary } from 'lib/dictionary'

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
				Settings
			</Button>
		</>
	)
}

function UserSettingsForm() {
	const [userSettings, setUserSettings] = useRecoilState(userConfig)

	const [selectTarget, targetLanguage] = useSelectLanguageCode(
		userSettings.targetLanguage,
		'Target Language'
	)
	const [selectNative, nativeLanguage] = useSelectLanguageCode(
		userSettings.nativeLanguage,
		'Native Language'
	)

	const clearHandler = () => {
		if (confirm('are you sure you want to clear dictionary?')) {
			clearDictionary()
		}
	}

	const changeUserSettings = () => {
		setUserSettings(old => ({ ...old, targetLanguage, nativeLanguage }))
	}

	return (
		<>
			{selectTarget}
			{selectNative}
			<br />
			<Button color='green' onClick={changeUserSettings}>
				Change User Settings
			</Button>
			<br />
			<br />
			<Button color='red' onClick={clearHandler}>
				Clear Dictionary
			</Button>
		</>
	)
}

function useSelectLanguageCode(init: string, label: string) {
	const [code, setCode] = React.useState<string>(init)

	const selectComponent = (
		<Select
			label={label}
			placeholder='Select language'
			value={code}
			onChange={value => setCode(value ?? init)}
			data={[
				{ value: 'pt-PT', label: 'Portuguese' },
				{ value: 'en', label: 'English' },
				{ value: 'ru-RU', label: 'Russian' },
			]}
		/>
	)
	return [selectComponent, code, setCode] as const
}
