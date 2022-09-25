import { getTranscript, getYtplayer } from 'lib/ytplayer'
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
export const ytVideoCaptions = selectorFamily({
	key: 'ytVideoCaptions',
	get:
		(languageCode: string) =>
		async ({ get }) => {
			get(ytVideoId) //make selector re-run everytime the video changes
			//TODO rerun only when languageCode changes
			// const user = get(userConfig) //r-run when user config changes
			return getTranscript(languageCode)
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
			const transcripts = get(ytVideoCaptions(languageCode)).texts

			//TODO find faster way to search for next caption line
			//maybe arrayt with time (100 ms step) as index?
			const transcript = transcripts.find(
				({ time, duration }) => current > time && time + duration > current
			)
			if (transcript === undefined) {
				return ''
			}
			return transcript.text
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
