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
	})

export interface TranscriptEntry {
	time: number
	duration: number
	text: string
}

export interface Transcript {
	languageCode: string
	texts: TranscriptEntry[]
}

export type CaptionTrack = {
	languageCode: string
	baseUrl: string
}

export function getAvailableCaptionTracks(): CaptionTrack[] {
	//@ts-ignore
	if (window?.ytplayer === undefined) {
		return []
	}
	//@ts-ignore
	return window.ytplayer.config.args.raw_player_response.captions
		.playerCaptionsTracklistRenderer.captionTracks
}

export async function getTranscript(track: CaptionTrack): Promise<Transcript> {
	const { baseUrl, languageCode } = track
	console.log('loading transcript')
	const url = `${baseUrl}&fmt=json3`
	const resp = await fetch(url)
	const data = await resp.json()

	const texts = data.events.map((event: any) => ({
		time: event.tStartMs,
		duration: event.dDurationMs,
		text: event.segs[0].utf8, //TODO handle multiple segments
	}))

	return {
		languageCode,
		texts,
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
