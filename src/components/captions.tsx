import { useRecoilValue } from 'recoil'
import {
	ytContentWidth,
	ytDisplayedCaptions,
	ytplayer,
	ytVideoId,
} from 'store/player'
import { bidirectionalDictionary } from 'store/dictionary'
import React from 'react'
import ReactDOM from 'react-dom'
import { Translation } from 'lib/dictionary'
import { userConfig } from 'store/user'
import { WrappedYtplayer } from 'lib/ytplayer'
import { Tooltip } from 'components/popover'
import { Space } from './text'

const captionsContainerClassName = 'yttranslation-captions-Noux1oop'

const CaptionsContainer = () => {
	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'center',
				position: 'absolute',
				width: '100%',
				height: '100%',
				top: '0',
			}}
		>
			<CaptionsDisplayArea />
		</div>
	)
}

const CaptionsDisplayArea = () => {
	const user = useRecoilValue(userConfig)
	const targetLine = useRecoilValue(ytDisplayedCaptions(user.targetLanguage))
	const nativeLine = useRecoilValue(ytDisplayedCaptions(user.nativeLanguage))
	const contentW = useRecoilValue(ytContentWidth)
	if (targetLine === '' || nativeLine === '') {
		return null
	}

	const width = contentW < 700 ? contentW : 0.5 * contentW + 350
	const fontSize = contentW < 700 ? 1.5 : 1.5 + (contentW - 700) / 1000

	console.log('======= update caption display area =======')
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				position: 'absolute',
				fontSize: `${fontSize.toFixed(2)}rem`,
				bottom: '10%',
				width: `${Math.round(width)}px`,
			}}
		>
			<CaptionLine>
				<TranslatedCaption text={targetLine} />
			</CaptionLine>
			<div style={{ marginTop: '0.5em' }}>
				<CaptionLine>{nativeLine}</CaptionLine>
			</div>
		</div>
	)
}

const CaptionLine = ({ children }: { children: React.ReactNode }) => {
	return (
		<div
			style={{
				position: 'relative',
				zIndex: '300',
				padding: '0.2em 0.5em',
				background: 'rgba(0, 0, 0, 0.5)',
				textAlign: 'center',
			}}
		>
			{children}
		</div>
	)
}

const TranslatedCaption = ({ text }: { text: string }) => {
	const dictionary = useRecoilValue(bidirectionalDictionary)
	//split string by new-lines and spaces and map word to translated
	const words = text
		.split('\n')
		.join(' ')
		.split(' ')
		.map((word, i) => (
			<TranslatedWord
				key={i}
				word={word}
				translations={dictionary.get(trimDictionaryWord(word).toLowerCase())}
			/>
		))

	return (
		<span
			style={{ fontWeight: 'bold', fontSize: '1.3em' }}
			className={captionsContainerClassName}
		>
			{words}
		</span>
	)
}

interface TranslatedWordProps {
	word: string
	translations?: Translation[]
}

//TODO show only most correct translation variants
const TranslatedWord = ({ word, translations = [] }: TranslatedWordProps) => {
	const [filtered, setFiltered] = React.useState(true)

	//for now show only first 4 words on hover and rest on click
	const labels = translations
		.sort((a, b) => b[1] - a[1])
		.slice(0, filtered ? 3 : translations.length)
		.map(([variant], i) => (
			<div
				key={i}
				style={{
					fontSize: i === 0 ? '1.5em' : '1.1em',
					color: i === 0 ? 'white' : 'lightgray',
					fontWeight: i === 0 ? 700 : 400,
				}}
			>
				{variant}
			</div>
		))

	const onClick = () => setFiltered(!filtered)

	const label = labels.length === 0 ? word : labels
	return (
		<Tooltip
			trigger={
				<span onClick={onClick} style={{ cursor: 'pointer' }}>
					{word}
					<Space />
				</span>
			}
		>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					flexDirection: 'column-reverse',
				}}
			>
				{label}
			</div>
		</Tooltip>
	)
}

export const Captions = () => (
	//Captions portal must be wrrapped in Suspense
	<React.Suspense fallback={null}>
		<CaptionsPortal />
	</React.Suspense>
)

export const CaptionsPortal = () => {
	const player = useRecoilValue(ytplayer)
	const videoId = useRecoilValue(ytVideoId)
	const user = useRecoilValue(userConfig)

	React.useEffect(() => {
		player.setCaptionsLanguage(user.targetLanguage)
	}, [videoId])

	const [captionsPortal] = useReplaceNativeCaptions(player)
	return <>{captionsPortal}</>
}

type ReactPortal = ReturnType<typeof ReactDOM.createPortal>

interface CaptionLine {
	text: string
	origin: Element
}

//useCaptionsObserver watches for captions
//To adapt to another player also change captionsMutationCallback(...)
export const useCaptionsObserver = (): [CaptionLine[]] => {
	const player = useRecoilValue(ytplayer)
	const videoId = useRecoilValue(ytVideoId)

	// const [captions, setCaptions] = React.useState<ReactPortal[]>([])
	const [captions, setCaptions] = React.useState<CaptionLine[]>([])

	React.useEffect(() => {
		const observer = new MutationObserver(captionsMutationCallback(setCaptions))
		const container = player.getCaptionsContainer()
		if (container === null) {
			console.log("WARN Can't find captions container")
			return
		}
		console.log('update captions container', container)
		observer.observe(container, {
			childList: true,
			subtree: true,
		})
		//TODO use downloaded captions instead of mutation observer (maybe keep observer for faster first load)
		return () => observer.disconnect()
	}, [videoId])

	return [captions]
}

//trimDictionaryWord trims word of special characters
//Works by comparing lower and upper case, so will not work in some languages.
const trimDictionaryWord = (str: string) => {
	const lower = str.toLowerCase()
	const upper = str.toUpperCase()

	let res = ''
	let start = true
	for (let i = 0; i < lower.length; ++i) {
		//if lower case not equal to upper than it's not a special character
		if (lower[i] !== upper[i] || !isNaN(Number(lower[i]))) {
			// when meet first not special character set indicate that by setting start
			start = false
			res += str[i]
		} else {
			// when meet special character by the end of the word then exit.
			if (!start) {
				break
			}
		}
	}
	return res.trim()
}

type CaptionsSetter = (captions: CaptionLine[]) => void

const captionsMutationCallback = (
	setCaptions: CaptionsSetter
): MutationCallback => {
	const callback = (records: MutationRecord[]) => {
		const captions: CaptionLine[] = []
		records.forEach(record => {
			const origin = record.target as HTMLElement
			if (!origin.className.includes('ytp-caption-segment')) {
				return
			}
			if (
				origin.children[0]?.className?.includes?.(captionsContainerClassName)
			) {
				return
			}
			const text = origin.innerText.slice()
			//Ignore change when inner text set to empty string to avoid racing when clearing original text
			if (text === '') {
				return
			}
			//Set original text to empty string to clear original text
			origin.innerText = ''
			captions.push({ text, origin })
		})
		//It prevents re-rendering of captions when they are not changed
		//but makes them hang on the screen until next mutation they are deleted.
		if (captions.length > 0) {
			setCaptions(captions)
		}
	}
	return callback
}

const captionsWrapperId = 'yttranslation-captions-wrapper-Noux1oop'
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

const useReplaceNativeCaptions = (player: WrappedYtplayer): ReactPortal[] => {
	const container = createCaptionsWrapper(player)
	//TODO should we unmount react portals?
	return [ReactDOM.createPortal(<CaptionsContainer />, container)]
}

//places custom captions directly in place of original ones
// const replaceCaptionLines = (captions: CaptionLine[]): ReactPortal[] =>
// 	captions.map(caption => ReactDOM.createPortal(<CaptionsLine text={text} />, caption.origin))
