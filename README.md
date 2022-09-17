## In Progress
	- Should work when user choose videa via UI (now only on page load)

## Sprint
	- Fix words flickering when tooltip appear
	- subtitles container should stay in one vertical polition (bottom bar now makes it jump around)
	- load dictionaries from temporary repository on github
	- Show native and target language captions at the same time.
	### Completed in sprint
	+ Setup learning target language
	+ Set captions to target langugage automatically (if captions exist)
	+ Show UI immediately after page load (don't wait for dictionary load)
	+ show same word if translation not found
	+ use fuzzy search to find simmilar word and Levenshtine distance to find best match.
	+ cache fuzzy search index

## Backlog
	- "Report missing/wrong translation" feature for dev purposes (log varians if exist).
	- **Interface**
		- Create app setings
	- **Improve words detection**
		- lookup two (three?) words combinations (just use neighbors) to cover such cases 'às vezes  sometimes 13'
		- Split only by spaces and then fall-back to spliting by '-'
		- use aproximate translation if word not found?
			- what if different dictionaries uses different notation for characters like 'é'
	- **Improve lookup**
		- Show translation for rare words on pause (use socre first then calculate based on lookup count)
		- show rest of sugestions on click or on long hover?
	- **Dictionary preparation**
		- make sure that every source dictionary file are UTF8
		- filter from source dictionary wrong entries
			- incorrect langugae pair
			- correct language but incorrect translation variant (use score?)
	- **Perfomance**
		- words usage frequency, could we use score from library as loose indication of frequency?
			- preload most used words first and then rest of the dictionary
	- **Dev environment**
		- use MSW.js mocking library to be able to develop with HMR on dev page
	- find a way to detect words in sentence using existing dictionary database,
		-	don't relay that much on characters triming, it hard to adapt to every language.

## Done
	- separate floating button from portals
	- Trim all characters not related to word (eg " ? ).
	- redesign popover, make accent on most used words
	- display by default few variants with highest score
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
