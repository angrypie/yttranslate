import { selector } from 'recoil'
import { Dictionary, fetchDictionary } from 'lib/dictionary'

export const bidirectionalDictionary = selector({
	key: 'bidirectional-dictionary',
	get: async (): Promise<Dictionary> => {
		return await fetchDictionary()
	},
})
