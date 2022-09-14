import { set, get, clear } from 'idb-keyval'
import {
	create,
	insertBatch,
	Lyra,
	search,
	save,
	PropertiesSchema,
} from '@lyrasearch/lyra'
import * as levenshtein from 'fastest-levenshtein'
import { match, P } from 'ts-pattern'

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
	const dict = await FuzzyDictionary(pairs)
	return dict
}

type FuzzySchema = {
	word: 'string'
}

async function FuzzyDictionary(pairs: [string, Translation[]][]) {
	const map = new Map<string, Translation[]>(pairs)
	console.log('Dictionary created (size)', pairs.length)
	const backup: string | undefined = await get('pt-en-fuzzy-search')

	const db = match(backup)
		.with(P.string, (backup) => {
			const db = restoreLyra<FuzzySchema>(backup)
			console.log("fuzzy search restored")
			return db
		})
		.otherwise(() => {
			const db = create<FuzzySchema>({ schema: { word: 'string' } })
			insertBatch(
				db,
				pairs.map(([word]) => ({ word }))
			).then(() => {
				console.log('fuzzy search ready')
				set('pt-en-fuzzy-search', persistLyra(db)).then(() => {
					console.log('fuzzy search backup saved')
				})
			})
			return db
		})

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

function restoreLyra<T extends PropertiesSchema>(data: string): Lyra<T> {
	const db = create({
		schema: {
			__placeholder: 'string',
		},
	})
	const deserialized = JSON.parse(data.toString())

	db.index = deserialized.index
	db.docs = deserialized.docs
	db.nodes = deserialized.nodes
	db.schema = deserialized.schema
	return db as unknown as Lyra<T>
}

function persistLyra<T extends PropertiesSchema>(db: Lyra<T>): string {
	return JSON.stringify(save(db))
}
