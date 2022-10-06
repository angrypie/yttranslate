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

export async function fetchDictionary(): Promise<Dictionary> {
	const serialMap = await get('pt-en')

	const pairs = await match(serialMap)
		.with(P.string, serialized => {
			console.log('Using cached dictionary')
			return JSON.parse(serialized) as [string, Translation[]][]
		})
		.otherwise(async () => {
			console.log('Fetching dictionary')
			const dictUrl = 'http://localhost:9111/pt-en.dic.gz'
			try {
				const resp = await fetch(dictUrl, { mode: 'cors' })
				let text = await resp.text()

				const pairs = parseDictionary(text)

				const serializedDict = JSON.stringify(pairs)
				await set('pt-en', serializedDict)
				return pairs
			} catch (err) {
				alert(err)
				throw err
			}
		})

	return FuzzyDictionary(pairs)
}

type FuzzySchema = {
	word: 'string'
}

async function FuzzyDictionary(pairs: [string, Translation[]][]) {
	const map = new Map<string, Translation[]>(pairs)
	console.log('Dictionary created (size)', pairs.length)
	const backup: string | undefined = await get('pt-en-fuzzy-search')

	let db: null | Lyra<FuzzySchema> = null

	//TODO make it assync
	match(backup)
		.with(P.string, async backup => {
			db = restoreLyra<FuzzySchema>(backup)
			console.log('fuzzy search restored')
		})
		.otherwise(async () => {
			const newDb = create<FuzzySchema>({ schema: { word: 'string' } })
			await insertBatch(
				newDb,
				pairs.map(([word]) => ({ word }))
			)
			db = newDb
			console.log('fuzzy search ready')
			set('pt-en-fuzzy-search', persistLyra(db)).then(() => {
				console.log('fuzzy search backup saved')
			})
		})

	return {
		get(word: string) {
			// TODO improve lookup
			// console.log("improve lookup")
			const firstTry = map.get(word)
			if (firstTry !== undefined) {
				return firstTry
			}

			if (db === null) {
				console.log('fuzzy search is not ready')
				return []
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
			return map.get(closest) ?? []
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
function parseDictionary(text: string): [string, Translation[]][] {
	const dict: [string, Translation[]][] = []
	const rows = text.split('\n')
	for (let row of rows) {
		const columns: Variants = row.split('\t')
		const result: [string, Translation[]] = [columns[0] as string, []]
		for (let i = 1; i < columns.length; i += 2) {
			result[1].push([columns[i] as string, parseInt(columns[i + 1] as string)])
		}
		dict.push(result)
	}
	return dict
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
