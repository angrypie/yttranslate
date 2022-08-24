import ky from 'ky'

export async function getDictionary(): Promise<string> {
	const url =
		'https://raw.githubusercontent.com/mantine/dictionary/master/dictionary.txt'

	return await ky.get(url).text()
}

export type YoutubeCaptionTracks = {
	languageCode: string
	baseUrl: string
}[]

