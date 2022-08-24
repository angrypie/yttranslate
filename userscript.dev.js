// ==UserScript==
// @name        react-userscript-template
// @description Create userscripts with React.js using live-reload and instand build time (esbuild)
// @include     https://www.youtube.com/*
// @version     0.0.1
// @inject-into page
// ==/UserScript==
// ==/UserScript==

;(function () {
	startReloadWatch()
})()

//getBundle is asncy function that fetches plain text from server with cors disabled
async function getBundle(url) {
	try {
		const response = await fetch(url, {
			method: 'GET',
			mode: 'cors',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'text/plain',
			},
		})
		return response.text()
	} catch (error) {
		console.error('rollup-userscript: error fetching bundle')
		throw error
	}
}

//hashString is a function that returns a hash of a string
function hashString(string) {
	let hash = 0
	for (let i = 0; i < string.length; i++) {
		hash = string.charCodeAt(i) + ((hash << 5) - hash)
	}
	return hash
}

//startReloadWatch fetches bundle every 2 seconds
//and compare the hash of the bundle with the hash of the previous bundle
//and reloads the page if hash is different
async function startReloadWatch() {
	const url = `http://localhost:9111/dev.bundle.js`
	const bundle = await getBundle(url)
	eval(bundle)

	const previousHash = hashString(bundle)
	setInterval(async () => {
		const newHash = hashString(await getBundle(url))
		if (newHash !== previousHash) {
			window.location.reload()
		}
	//It takes server some time to produce bundle
	}, 1000)
}
