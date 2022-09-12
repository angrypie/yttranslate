import { atom, selector } from 'recoil'
import { getYtplayer } from 'lib/ytplayer'

export const ytplayer = selector({
	key: 'ytplayer',
	get: async () => {
		return await getYtplayer()
	},
})

export const currentTime = atom<number>({
	key: 'playelUpdateLoop',
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
		return player.getCurrentTime()
	},
})
