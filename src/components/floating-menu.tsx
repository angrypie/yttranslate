import { IconLanguage } from '@tabler/icons'
import { Affix, Button, Text, Tooltip } from '@mantine/core'
import { useRecoilValue } from 'recoil'
import {
	bidirectionalDictionary,
	ytplayer,
	ytplayerTime,
} from '../store/player'
import React from 'react'
import ReactDOM from 'react-dom'
import { clearDictionary } from '../lib/dictionary'

export function FloatMenu() {
	return (
		<Affix position={{ bottom: 20, right: 20 }}>
			<React.Suspense fallback={<div>Loading...</div>}>
				<MenuButton />
			</React.Suspense>
		</Affix>
	)
}

//MuneButton waits for player to be loaded
const MenuButton = () => {
	const player = useRecoilValue(ytplayer)

	const onClick = () => {
		if (confirm('are you sure you want to exit?')) {
			clearDictionary()
		}
	}

	React.useEffect(() => {
		setTimeout(() => {
			player.pauseVideo()
		}, 2000)
	}, [])
	console.log('DEV_INFO ROOT RE-RENDER')
	return (
		<>
			<Button onClick={onClick} leftIcon={<IconLanguage size={16} />}>
				Clead dictionary <PlayerTime />
			</Button>
			<CaptionsPortal />
		</>
	)
}

const PlayerTime = () => {
	const time = useRecoilValue(ytplayerTime)
	return <Text>{time.toFixed()}s</Text>
}

const captionsContainerClassName = 'yttranslation-captions'

const TranslatedCaptions = ({ text }: { text: string }) => {
	console.log('render captions', text)
	const dictionary = useRecoilValue(bidirectionalDictionary)
	const words = text
		.split(' ')
		.map((word, i) => (
			<TranslatedWord
				key={i}
				word={word}
				translation={dictionary.get(trimDictionaryWord(word))}
			/>
		))

	return <span className={captionsContainerClassName}>{words}</span>
}

const TranslatedWord = ({
	word,
	translation,
}: {
	word: string
	translation: string
}) => {
	return (
		<Tooltip color='blue' offset={30} label={translation || '<no translation>'}>
			<span style={{ cursor: 'pointer' }}>
				{word}
				<Space />
			</span>
		</Tooltip>
	)
}

const Space = () => <span>&nbsp;</span>

const CaptionsPortal = () => {
	const [captions] = useCaptionsObserver()
	return <>{captions}</>
}

//useCaptionsObserver watches for captions replace them with translatable ones
//and return portals to render them and substitute original ones
const useCaptionsObserver = () => {
	const player = useRecoilValue(ytplayer)
	const [captions, setCaptions] = React.useState<React.ReactPortal[]>([])
	React.useEffect(() => {
		const observer = new MutationObserver(records => {
			const portals = []
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
		observer.observe(player.getCaptionsContainer(), {
			childList: true,
			subtree: true,
		})
		return () => observer.disconnect()
	}, [])
	return [captions]
}

//function that trim  comas and semi-colons from the start and end of the string.
export function trimDictionaryWord(str: string) {
	return str.replace(/^[\s,;\.]+|[\s,;\.]+$/g, '')
}
