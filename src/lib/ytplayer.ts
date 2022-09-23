//ExposedYtplayer is a interface for watever methods are availabel

//to interact with the youtube player.
export interface ExposedYtplayer extends HTMLDivElement {
	getVideoData(): { video_id: string }
	pauseVideo(): void
	playVideo(): void
	getCurrentTime(): number
	getCaptionWindowContainerId(): string
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

interface Transcript {
	languageCode: string
	texts: TranscriptEntry[]
}

export const getTranscript = async (languageCode: string): Promise<Transcript> => {
	console.log("loading transcript")
	//@ts-ignore
	const tracks = window.ytplayer.config.args.raw_player_response.captions
		.playerCaptionsTracklistRenderer.captionTracks as {
		baseUrl: string
		languageCode: string
	}[]
	const track = tracks.find(track => track.languageCode === languageCode)
	if (track === undefined) {
		throw Error('Track not found')
	}
	const url = `${track.baseUrl}&fmt=json3`
	const resp = await fetch(url)
	const data = await resp.json()

	const texts = data.events.map((event: any) => ({
		time: event.tStartMs,
		duration: event.dDurationMs,
		text: event.segs[0].utf8,
	}))

	return {
		languageCode,
		texts,
	}
}
