## In Progress
	- display by default few variants with highest score
	- redesign popover, make accent on most used words
	- Trim all characters not related to word (eg " ? ).

## Backlog
	- Create button that toggles 'learning mode'
		- Setup learning (target) language
		- Set captions to target langugage automatically (if captions exist)
	- How to load dictionary to Safari, considering access controll checks?
	- show rest of sugestions on click or on long hover?
	- figure out why some popular words not in dictionary (bem vindos)
	- use aproximate translation if word not found?
		- what if different dictionaries uses different notation for characters like 'é'
	- separate floating button from portals
	- preload most used words first and then rest of the dictionary
	- make sure that every source dictionary file are UTF8
	- use MSW.js mocking library to be able to develop with HMR on dev page
	- find a way to filter wrong translation variants from dictionary source

## Done
	- implement score for each variant and sort them in export file
	- setup esbuild to serve gzip files with 'content-encoding: gzip'
	- display suggestions / variants (first 4 on hover, rest on click)
	- figure out how freedict works, is it suitable? (for now I will be working with 'my' dictionary)
	- merge all dictionaries available
	- use detecting language library to filter other languages (it may be like 10% of them)
	- use wordList of all the portuguese words in tests for makedict to be sure that all words are preset 
	- prepare dictionary on the server (compress to load faster?)
		- join few various dictionaries to have more words (for now its's angrypie/makedict)
	- find source of usable dictionaries
	- configure esbuild to use new React 17 JSX transform (jsx: 'automatic')
	- switch to esbuild
	- replace mantine (radix-ui is unstyled and didn't found universal ReactNative/React kit)
