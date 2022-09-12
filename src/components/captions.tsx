import { Tooltip } from '@mantine/core'
import { useRecoilValue } from 'recoil'
import { ytplayer } from 'store/player'
import { bidirectionalDictionary } from 'store/dictionary'
import React from 'react'
import ReactDOM from 'react-dom'
import { Translation } from 'lib/dictionary'
import { Space } from 'components//text'

const captionsContainerClassName = 'yttranslation-captions'

const TranslatedCaptions = ({ text }: { text: string }) => {
	const dictionary = useRecoilValue(bidirectionalDictionary)
	const words = text
		.split(' ')
		.map((word, i) => (
			<TranslatedWord
				key={i}
				word={word}
				translations={dictionary.get(trimDictionaryWord(word).toLowerCase())}
			/>
		))

	return <span className={captionsContainerClassName}>{words}</span>
}

interface TranslatedWordProps {
	word: string
	translations?: Translation[]
}

//TODO show only most correct translation variants
const TranslatedWord = ({ word, translations }: TranslatedWordProps) => {
	const [opened, setOpened] = React.useState(false)
	const [filtered, setFiltered] = React.useState(true)

	//for now show only first 4 words on hover and rest on click
	const label = translations
		?.sort((a, b) => b[1] - a[1])
		.slice(0, filtered ? 3 : translations.length)
		.map(([variant], i) => (
			<div
				key={i}
				style={{
					fontSize: i === 0 ? '.9em' : '.6em',
					color: i === 0 ? 'white' : 'lightgray',
					fontWeight: i === 0 ? 600 : 400,
				}}
			>
				{variant}
			</div>
		))
	return (
		<Tooltip
			opened={opened}
			onMouseLeave={() => setOpened(false)}
			onClick={e => {
				//TODO stop default captions to responding to clicks (maybe replace with custom conatiner?)
				e.preventDefault()
				e.stopPropagation()
				setFiltered(!filtered)
				setOpened(!opened)
			}}
			onMouseEnter={() => setOpened(true)}
			color='pink'
			style={{
				fontSize: '1em',
				display: 'flex',
				flexDirection: 'column-reverse',
			}}
			offset={30}
			label={label ?? word}
		>
			<span style={{ cursor: 'pointer' }}>
				{word}
				<Space />
			</span>
		</Tooltip>
	)
}

export const CaptionsPortal = () => {
	//Use dictionary to force fetching dictionary as fast as possbile
	useRecoilValue(bidirectionalDictionary)
	const [captions] = useCaptionsObserver()
	return <>{captions}</>
}

type ReactPortal = ReturnType<typeof ReactDOM.createPortal>

//useCaptionsObserver watches for captions replace them with translatable ones
//and return portals to render them and substitute original ones
const useCaptionsObserver = () => {
	const player = useRecoilValue(ytplayer)
	const [captions, setCaptions] = React.useState<ReactPortal[]>([])
	React.useEffect(() => {
		const observer = new MutationObserver(records => {
			const portals: ReactPortal[] = []
			records.forEach(record => {
				const target = record.target as HTMLElement
				if (!target.className.includes('ytp-caption-segment')) {
					return
				}
				if (
					target.children[0]?.className?.includes?.(captionsContainerClassName)
				) {
					return
				}
				const text = target.innerText.slice()
				//Ignore change when inner text set to empty string to avoid racing when clearing original text
				if (text === '') {
					return
				}
				//Set original text to empty string to clear original text
				target.innerText = ''
				portals.push(
					ReactDOM.createPortal(<TranslatedCaptions text={text} />, target)
				)
			})
			//It prevents re-rendering of captions when they are not changed
			//but makes them hang on the screen until next mutation
			if (portals.length > 0) {
				setCaptions(portals)
			}
		})
		const container = player.getCaptionsContainer()
		console.log('captions container', container)
		observer.observe(container, {
			childList: true,
			subtree: true,
		})
		return () => observer.disconnect()
	}, [])
	return [captions]
}

//trimDictionaryWord trims word of special characters
//Works by comparing lower and upper case, so will not work in some languages.
function trimDictionaryWord(str: string) {
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
