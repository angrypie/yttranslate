import { atom } from 'recoil'

interface UserConfig {
	targetLanguage: string
}

//TODO set target language using UI
export const userConfig = atom<UserConfig>({
	key: 'userConfig',
	default: {
		targetLanguage: 'pt-PT',
	},
})
