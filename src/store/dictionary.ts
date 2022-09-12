import { selector } from 'recoil'
import { fetchDictionary, Translation } from 'lib/dictionary'

export const bidirectionalDictionary = selector({
	key: 'bidirectional-dictionary',
	get: async (): Promise<Map<string, Translation[]>> => {
		return await fetchDictionary()
	},
})
