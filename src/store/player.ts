import { getTranscript, getYtplayer, TranscriptEntry } from 'lib/ytplayer'
import { atom, selector } from 'recoil'
import { userConfig } from './user'

export const ytplayer = selector({
	key: 'ytplayer',
	get: async () => {
		return await getYtplayer()
	},
})

export const currentTime = atom<number>({
	key: 'playerUpdateLoop',
	default: 0,
	effects: [
		({ setSelf }) => {
			const interval = setInterval(() => {
				setSelf(new Date().getTime())
			}, 100)
			return () => clearInterval(interval)
		},
	],
})

export const ytplayerTime = selector({
	key: 'ytplayerTime',
	get: ({ get }) => {
		get(currentTime) //making selector re-run everytime currentTime changes
		const player = get(ytplayer)
		return player.getCurrentTime() * 1000
	},
})

//ytVideoId is the id of the video that is currently playing.
//It is used to check if the video has changed.
export const ytVideoId = selector({
	key: 'ytVideoId',
	get: ({ get }) => {
		get(currentTime) //making selector re-run everytime currentTime changes
		const player = get(ytplayer)
		return player.getVideoData().video_id
	},
})

//ytVideoCaptions is the captions for the current video
export const ytVideoCaptions = selector({
	key: 'ytVideoCaptions',
	get: async ({ get }) => {
		get(ytVideoId) //make selector re-run everytime the video changes
		//TODO rerun only when languageCode changes
		const user = get(userConfig) //r-run when user config changes
		return getTranscript(user.targetLanguage)
	},
})

//ytCurrentCaptions is the captions that should be displayed based on current view progress
export const ytDisplayedCaptions = selector({
	key: 'ytCurrentCaptions',
	get: ({ get }) => {
		const current = get(ytplayerTime)
		const transcripts = get(ytVideoCaptions).texts


		//TODO find faster way to search for next caption line, maybe map with time as key?
		const transcript = transcripts.find(({ time, duration}) =>
			current > time && time + duration > current
		)
		if (transcript === undefined) {
			return '<no captions>'
		}
		return transcript.text
	},
})
