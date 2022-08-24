import { set, get } from 'idb-keyval'

export async function fetchDictionary() {
	let serialMap = await get('pt-en')
	let pairs = []

	if (serialMap === undefined) {
		console.log('Fetching dictionary')
		const dictUrl =
			'https://api.codetabs.com/v1/proxy?quest=https://dl.fbaipublicfiles.com/arrival/dictionaries/pt-en.txt'
		try {
			const resp = await fetch(dictUrl, { mode: 'cors' })
			let text = await resp.text()

			pairs = text.split('\n').map(row => row.split('\t'))

			const serializedDict = JSON.stringify(pairs)

			await set('pt-en', serializedDict)
		} catch (err) {
			alert(err)
			return
		}
	} else {
		console.log('Using cached dictionary')
		pairs = JSON.parse(serialMap)
	}
	console.log("Dictionary created (size)", pairs.length)
	return new Map<string, string>(pairs)
}