//ExposedYtplayer is a interface for watever methods are availabel

//to interact with the youtube player.
export interface ExposedYtplayer extends HTMLDivElement {
	getVideoData(): { video_id: string }
	pauseVideo(): void
	playVideo(): void
	getCurrentTime(): number
	getCaptionWindowContainerId(): string
	getVideoContentRect(): {
		left: number
		top: number
		width: number
		height: number
	}
	getOption(module: string, option: string): any
	setOption(module: string, option: string, value: any): void
	getPlayerResponse(): YtPlayerResponse
}

interface YtPlayerResponse {
	captions: {
		playerCaptionsTracklistRenderer: {
			captionTracks: CaptionTrack[]
			king: string
		}
	}
}

export type CaptionTrack = {
	languageCode: string
	baseUrl: string
	kind?: 'asr' | 'forced' | 'standard'
	name: { simpleText: string }
	isTranslatable: boolean
	vssId: string
}

//runtime check for object to be of type ExposedYtplayer
export function isExposedYtplayer(obj: any): obj is ExposedYtplayer {
	return (
		obj.getVideoData !== undefined &&
		obj.pauseVideo !== undefined &&
		obj.playVideo !== undefined &&
		obj.getCurrentTime !== undefined
	)
}

export interface WrappedYtplayer extends ExposedYtplayer {
	getCaptionsContainer(): HTMLElement | null
	setCaptionsLanguage(language: string): void
	getCaptionTracks(): CaptionTrack[]
}

//getYttlayer try to find movie_player eleement in the page.
//If it is found, it resolves promise with the player object.
//It try to find movie_player element every 300ms.
export async function getYtplayer(): Promise<WrappedYtplayer> {
	return new Promise(resolve => {
		const interval = setInterval(() => {
			const player = document.getElementById('movie_player')
			if (player === null) {
				return
			}
			if (!isExposedYtplayer(player)) {
				throw Error('"youtube movie_player found but not supported"')
			}
			resolve(wrapYtplayer(player))
			clearInterval(interval)
		}, 200)
	})
}

//wrapYtplayer wraps the player object and adds some extra methods.
const wrapYtplayer = (player: ExposedYtplayer): WrappedYtplayer =>
	Object.assign(player, {
		getCaptionsContainer: () =>
			document.getElementById(player.getCaptionWindowContainerId()),

		//setCaptionsLanguage changes the language of the captions.
		//use getOption('captions', 'tracklist') to get the list of available languages.
		setCaptionsLanguage(language: string) {
			player.setOption('captions', 'track', { languageCode: language })
		},

		//get available captions tracks list with url to load from server
		//sort tracks by type, auto-generated to be at the end
		getCaptionTracks(): CaptionTrack[] {
			const resp = player.getPlayerResponse()
			if (resp === undefined) {
				//TODO remove
				alert('player.getPlayerResponse() returned undefined')
				return []
			}
			return resp.captions.playerCaptionsTracklistRenderer.captionTracks.slice()
		},
	})

export interface TranscriptEntry {
	time: number
	duration: number
	text: string
}

export interface Transcript {
	languageCode: string
	entries: TranscriptEntry[]
}

type TranscriptData = {
	events: {
		tStartMs: number
		dDurationMs: number
		segs?: { utf8: string }[]
	}[]
}

//fetch and prepare transcript data from server
export async function getTranscript(track: CaptionTrack): Promise<Transcript> {
	const { baseUrl, languageCode } = track
	const url = `${baseUrl}&fmt=json3`
	const resp = await fetch(url)
	const data: TranscriptData = await resp.json()

	const entries: TranscriptEntry[] = []
	for (let event of data.events.sort((a, b) => a.tStartMs - b.tStartMs)) {
		const currentIndex = entries.length
		if (event.segs === undefined) {
			continue
		}
		const text = event.segs.map((seg: any) => seg.utf8).join(' ')
		if (text.trim() === '') {
			continue
		}
		//Normalization for auto-generated captions
		if (track.kind === 'asr' && currentIndex !== 0) {
			const prev = entries[currentIndex - 1]
			//Merge entries if combined text length no more than 100 chars
			//and time difference between entries is less than 5 seconds.
			if (
				prev.text.length + text.length < 100 &&
				event.tStartMs - (prev.time + prev.duration) < 5000
			) {
				prev.text += ' ' + text
				prev.duration = event.tStartMs - prev.time + event.dDurationMs
				continue
			}
			//If we age going to push new entry.
			//Stop previous entry as soon as new one starts
			prev.duration = event.tStartMs - prev.time
		}

		entries.push({
			time: event.tStartMs,
			duration: event.dDurationMs,
			text,
		})
	}

	return {
		languageCode,
		entries,
	}
}

//create yotube onStateChange event types as enum
export enum PlayerState {
	UNSTARTED = -1,
	ENDED = 0,
	PLAYING = 1,
	PAUSED = 2,
	BUFFERING = 3,
	CUED = 5,
}

//function that subscribes to youtube player events and calls the callback
//with current player state cocde.
//It also returns a function that can be called to unsubscribe from the events.
export function subscribeToPlayerState(
	player: WrappedYtplayer,
	callback: (state: PlayerState) => void
) {
	const onStateChange = (state: any) => {
		callback(state)
	}
	player.addEventListener('onStateChange', onStateChange)
	return () => player.removeEventListener('onStateChange', onStateChange)
}
