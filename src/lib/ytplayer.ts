//ExposedYtplayer is a interface for watever methods are availabel

//to interact with the youtube player.
export interface ExposedYtplayer {
	getVideoData(): { video_id: string }
	pauseVideo(): void
	playVideo(): void
	getCurrentTime(): number
}
//
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
	getCaptionsContainer(): HTMLElement
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
const wrapYtplayer = (player: ExposedYtplayer): WrappedYtplayer => ({
	...player,
	getCaptionsContainer: () =>
		document.getElementById('ytp-caption-window-container'),
})
