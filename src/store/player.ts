import { bestLangCodeMatch } from 'lib/languageCodes'
import {
	getTranscript,
	getYtplayer,
	PlayerState,
	subscribeToPlayerState,
	WrappedYtplayer,
} from 'lib/ytplayer'
import { atom, selector, selectorFamily } from 'recoil'
import { match } from 'ts-pattern'
import { userConfig } from './user'

export const ytplayer = selector({
	key: 'ytplayer',
	get: async () => {
		return await getYtplayer()
	},
})

export const updateLoopIntervalMs = 50

const frequentUpdateLoop = atom<number>({
	key: 'freequentUpdateLoop',
	default: 0,
	effects: [
		({ setSelf }) => {
			const interval = setInterval(() => {
				setSelf(new Date().getTime())
			}, updateLoopIntervalMs)
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
		const player = get(ytplayer)
		return player.getCaptionTracks()
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
			const user = get(userConfig)

			//If track is not available try to use target language auto-translation
			const track =
				bestLangCodeMatch(languageCode, available) ??
				(t => (t === undefined ? t : { ...t, translateTo: languageCode }))(
					bestLangCodeMatch(user.targetLanguage, available)
				)
			if (track === undefined) {
				return undefined
			}

			const transcripts = (await getTranscript(track)).entries

			//TODO what takes more space in memory, number or repeated strings?
			const steps: string[] = []

			for (const i of transcripts.keys()) {
				const { time, duration } = transcripts[i]
				//We must add 1 step to mae sure
				let step = Math.floor(time / updateLoopIntervalMs) + 1
				let current = step * updateLoopIntervalMs
				while (current >= time && time + duration > current) {
					steps[step] = i.toString()
					step += 1
					current = step * updateLoopIntervalMs
				}
			}

			console.log('size of prepared captions steps: ', steps.length)
			return { steps, transcripts }
		},
})

export const ytDisplayedCaptions = selectorFamily({
	key: 'ytDisplayedCaptions',
	get:
		(languageCode: string) =>
		({ get }) => {
			const captions = get(ytVideoCaptions(languageCode))
			//TODO maybe create helper to reproduce this pattern.
			//Selector helpers returns hash instead of the actual value to signal value should change.
			const displayed = get(ytNextDisplayedCaptions(languageCode))
			if (displayed === '' || captions === undefined) {
				return ''
			}
			return captions.transcripts[parseInt(displayed)].text
		},
})

//ytCurrentCaptions is the captions that should be displayed
//based on current view progress
export const ytNextDisplayedCaptions = selectorFamily({
	key: 'ytNextDisplayedCaptions',
	get:
		(languageCode: string) =>
		({ get }) => {
			const current = get(ytplayerTime)
			const captions = get(ytVideoCaptions(languageCode))
			if (captions === undefined) {
				return ''
			}

			const step = Math.floor(current / updateLoopIntervalMs)
			const entries = captions.steps[step] ?? ''

			return entries
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

export const captionsWrapperElement = selector({
	key: 'captionsWrapperElement',
	get: ({ get }) => {
		get(ytVideoId)
		return createCaptionsWrapper(get(ytplayer))
	},
})

const captionsWrapperId = 'yttranslation-captions-wrapper-Noux1oop'
//Create container element for portals to render into.
const createCaptionsWrapper = (player: WrappedYtplayer) => {
	const exist = document.getElementById(captionsWrapperId)
	if (exist !== null) {
		return exist
	}
	const wrapper = document.createElement('div', {})
	wrapper.setAttribute('id', captionsWrapperId)
	player.appendChild(wrapper)

	return wrapper
}

//Use player state subscription to detect when video paused.
export const ytPlayerPaused = atom<boolean>({
	key: 'ytPlayerPaused',
	default: false,
	effects: [
		({ setSelf, getPromise }) => {
			getPromise(ytplayer).then(player => {
				subscribeToPlayerState(player, state => {
					match(state)
						.with(PlayerState.PLAYING, () => setSelf(false))
						.with(PlayerState.PAUSED, () => setSelf(true))
						.run()
				})
			})
		},
	],
})
