interface WithLanguageCode {
	languageCode: string
	kind?: 'asr' | 'forced' | 'standard'
}
//attempts to match best language code from list to the user's language code
export const bestLangCodeMatch = <T extends WithLanguageCode>(
	languageCode: string,
	list: T[]
): T | undefined => {
	const search = (list: T[]) => {
		const found = list.find(l => l.languageCode === languageCode)
		if (found !== undefined) {
			return found
		}
		const stripped = languageCode.split('-')[0]
		return list.find(l => l.languageCode.split('-')[0] === stripped)
	}
	const noAsr = search(list.filter(l => l.kind !== 'asr'))
	if (noAsr !== undefined) {
		return noAsr
	}
	return search(list)
}
