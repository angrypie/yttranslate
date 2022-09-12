import { set, get, clear } from 'idb-keyval'
import { create, insertBatch, search } from '@lyrasearch/lyra'
import * as levenshtein from 'fastest-levenshtein'

//Variats allows us to use for a while tsv data format for translations.
//It will be changed soon but for now it's fast enough and convinient.
//Format: [targetWord variant1 var1_score variant2 var2_score]
type Variants = (string | number)[]
//Translation is a translation variant and it's score
export type Translation = [string, number]

export interface Dictionary {
	//Search word in dictionary and return translation variants
	get(word: string): Translation[]
}

export async function fetchDictionary() {
	let serialMap = await get('pt-en')
	let pairs: [string, Translation[]][] = []

	if (serialMap === undefined) {
		console.log('Fetching dictionary')
		// const dictUrl =
		// 	'https://api.codetabs.com/v1/proxy?quest=https://dl.fbaipublicfiles.com/arrival/dictionaries/pt-en.txt'
		const dictUrl = 'http://localhost:9111/pt-en.dic.gz'
		try {
			const resp = await fetch(dictUrl, { mode: 'cors' })
			let text = await resp.text()

			pairs = text
				.split('\n')
				.map(row => row.split('\t'))
				.map(words => [words[0], unflattenVariants(words.slice(1))])

			const serializedDict = JSON.stringify(pairs)

			await set('pt-en', serializedDict)
		} catch (err) {
			alert(err)
			throw err
		}
	} else {
		console.log('Using cached dictionary')
		pairs = JSON.parse(serialMap)
	}
	console.log('Dictionary created (size)', pairs.length)
	return FlexDictionary(pairs)
}

const FlexDictionary = (pairs: [string, Translation[]][]) => {
	const db = create({
		schema: {
			word: 'string',
		},
	})

	insertBatch(
		db,
		pairs.map(([word]) => ({ word }))
	).then(() => {
		console.log('fuzzy search ready')
	})

	const map = new Map<string, Translation[]>(pairs)
	return {
		get(word: string) {
			// TODO improve lookup
			// console.log("improve lookup")
			const firstTry = map.get(word)
			if (firstTry !== undefined) {
				return firstTry
			}
			const results = search(db, { term: word, properties: '*', limit: 1000 })
			if (results.hits.length === 0) {
				return []
			}

			const closest = levenshtein.closest(
				word,
				results.hits.map(hit => hit.word)
			)
			console.log('not found', word, 'but closest is', closest)
			return map.get(closest) || []
		},
	}
}

const MapDictionary = (pairs: [string, Translation[]][]) => {
	const map = new Map<string, Translation[]>(pairs)
	return {
		get: (word: string) => map.get(word) || [],
	}
}

export async function clearDictionary() {
	try {
		await clear()
	} catch (err) {
		alert('Failed to clean dictionary ' + err)
	}
}

//convert array contains flatened  tuples [string, number], unflatten them to Translation type
function unflattenVariants(variants: Variants): Translation[] {
	const result: Translation[] = []
	for (let i = 0; i < variants.length; i += 2) {
		result.push([variants[i] as string, parseInt(variants[i + 1] as string)])
	}
	return result
}
