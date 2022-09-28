import {
	getAvailableCaptionTracks,
	getTranscript,
	getYtplayer,
} from 'lib/ytplayer'
import { atom, selector, selectorFamily } from 'recoil'

export const ytplayer = selector({
	key: 'ytplayer',
	get: async () => {
		return await getYtplayer()
	},
})

const frequentUpdateLoop = atom<number>({
	key: 'freequentUpdateLoop',
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

//use with caution it may couse performance issues due to frequent updates
const ytplayerTime = selector({
	key: 'ytplayerTime',
	get: ({ get }) => {
		get(frequentUpdateLoop) //re-run everytime nextUpdateStep changes
		const player = get(ytplayer)
		return player.getCurrentTime() * 1000
	},
})

//ytVideoId is the id of the video that is currently playing.
//It is used to check if the video has changed.
export const ytVideoId = selector({
	key: 'ytVideoId',
	get: ({ get }) => {
		get(frequentUpdateLoop)
		const player = get(ytplayer)
		return player.getVideoData().video_id
	},
})

//ytVideoCaptions is the captions for the current video
export const ytAvailableCaptions = selector({
	key: 'ytAvailableCaptions',
	get: ({ get }) => {
		get(ytVideoId) //make selector re-run everytime the video changes
		return getAvailableCaptionTracks()
	},
})

//ytVideoCaptions is the captions for the current video
export const ytVideoCaptions = selectorFamily({
	key: 'ytVideoCaptions',
	get:
		(languageCode: string) =>
		async ({ get }) => {
			get(ytVideoId) //make selector re-run everytime the video changes
			const available = get(ytAvailableCaptions)
			const track = available.find(track => track.languageCode === languageCode)
			if (track === undefined) {
				return undefined
			}
			return getTranscript(track)
		},
})

//ytCurrentCaptions is the captions that should be displayed
//based on current view progress
export const ytDisplayedCaptions = selectorFamily({
	key: 'ytCurrentCaptions',
	get:
		(languageCode: string) =>
		({ get }) => {
			const current = get(ytplayerTime)
			const transcript = get(ytVideoCaptions(languageCode))
			if (transcript === undefined) {
				return ''
			}

			//TODO find faster way to search for next caption line
			//maybe arrayt with time (100 ms step) as index?
			const entry = transcript.texts.find(
				({ time, duration }) => current > time && time + duration > current
			)
			if (entry === undefined) {
				return ''
			}
			return entry.text
		},
})

//ytContentWidth is the width of the video content area
export const ytContentWidth = selector({
	key: 'ytContentWidth',
	get: ({ get }) => {
		get(frequentUpdateLoop)
		return get(ytplayer).getVideoContentRect().width
	},
})
