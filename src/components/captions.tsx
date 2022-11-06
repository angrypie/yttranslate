import { useRecoilValue } from 'recoil'
import {
	captionsWrapperElement,
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
import { Tooltip } from 'components/popover'
import { Space } from './text'
import { appConfig } from 'lib/config'

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

	const container = useRecoilValue(captionsWrapperElement)
	//TODO should we unmount react portals?
	const captionsPortal = ReactDOM.createPortal(<CaptionsContainer />, container)

	return <>{captionsPortal}</>
}

const captionsContainerClassName = 'yttranslation-captions-Noux1oop'

const CaptionsContainer = () => {
	const contentW = useRecoilValue(ytContentWidth)
	const wrapper = useRecoilValue(captionsWrapperElement)
	const fontSize = contentW < 700 ? 1.5 : 1.5 + (contentW - 700) / 1000
	//Set font size for captions wrapper created outside of React
	//wrapper hosts not only this component but other portals too (tooltips etc.)
	React.useEffect(() => {
		wrapper.style.fontSize = `${fontSize.toFixed(2)}rem`
	}, [wrapper, fontSize])
	console.log('CaptionsContainer rerender')
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

//TODO display multiple caption lines (currently only one is displayed)
const CaptionsDisplayArea = () => {
	const user = useRecoilValue(userConfig)
	const targetLine = useRecoilValue(ytDisplayedCaptions(user.targetLanguage))
	const nativeLine = useRecoilValue(ytDisplayedCaptions(user.nativeLanguage))
	const contentW = useRecoilValue(ytContentWidth)

	if (targetLine === '' && nativeLine === '') {
		return null
	}

	console.log('update display area')
	const width = contentW < 700 ? contentW : 0.5 * contentW + 350
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				position: 'absolute',
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
				zIndex: appConfig.ui.zIndex,
				padding: '0.2em 0.5em',
				background: 'rgba(0, 0, 0, 0.5)',
				textAlign: 'center',
			}}
		>
			{children}
		</div>
	)
}

//TODO rewrite respecting all possible delimeters (-, ;, etc.)
//parseCaptionText parses caption text and returns array of words
const captionEntryToWords = (entry: string): string[] => entry.split(/\s+/g)

const TranslatedCaption = ({ text }: { text: string }) => {
	const dictionary = useRecoilValue(bidirectionalDictionary)
	// split string by new-lines and spaces and map word to translated
	const words = captionEntryToWords(text).map((word, i) => (
		<>
			<TranslatedWord
				key={i}
				word={word}
				translations={dictionary.get(trimDictionaryWord(word).toLowerCase())}
			/>
			<Space />
		</>
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

const TranslatedWord = ({ word, translations = [] }: TranslatedWordProps) => {
	const tooltipContainer = useRecoilValue(captionsWrapperElement)
	const [filtered, setFiltered] = React.useState(true)

	//for now show only first 4 words on hover and rest on click
	const labels = translations
		.sort((a, b) => b[1] - a[1])
		.slice(0, filtered ? 3 : translations.length)
		.map(([variant], i) => (
			<div
				key={i}
				style={{
					fontSize: i === 0 ? '1.3em' : '1em',
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
			container={tooltipContainer}
			trigger={
				<span onClick={onClick} style={{ cursor: 'pointer' }}>
					{word}
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
