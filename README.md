## In Progress
	- How to load dictionary to safary, considering access controll checks?
	- find a way to filter wrong translation variants from dictionary source
		- implement score for each variant and display by tefault few variants with highest score
	- Create button that toggles 'learning mode'
		- Setup learning (target) language
		- Set captions to target langugage automatically (if captions exist)

## Backlog
	- show rest of sugestions on click or on long hover?
	- figure out why some popular words not in dictionary (bem vindos)
	- use aproximate translation if word not found?
	- separate floating button from portals
	- use MSW.js mocking library to be able to develop with HMR on dev page

## Done
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
