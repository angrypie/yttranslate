// ==UserScript==
// @name        react-userscript-template
// @description Create userscripts with React.js using live-reload and instand build time (esbuild)
// @match     https://*.youtube.com/*
// @version     0.0.1
// @inject-into page
// ==/UserScript==
// ==/UserScript==

;(function () {
	startReloadWatch()
})()

//hashString is a function that returns a hash of a string
function hashString(string) {
	let hash = 0
	for (let i = 0; i < string.length; i++) {
		hash = string.charCodeAt(i) + ((hash << 5) - hash)
	}
	return hash
}

//startReloadWatch fetches bundle every 1 seconds
//and compare the hash of the bundle with the hash of the previous bundle
//and reloads the page if hash is different
async function startReloadWatch() {
	const url = `http://localhost:9111/dev.bundle.js`
	const bundle = await getBundle(url)
	try {
		Function(bundle)()
	} catch (err) {
		console.error('trying to eval bundle with Function(bundle)', err)
	}

	const previousHash = hashString(bundle)
	setInterval(async () => {
		const newHash = hashString(await getBundle(url))
		if (newHash !== previousHash) {
			window.location.reload()
		}
		//check for new bundle every 1 seconds
	}, 1000)
}

//getBundle is asncy function that fetches plain text from server with cors disabled
async function getBundle(url) {
	const response = await getBundleWithCache(url)
	return response.text()
}

async function getBundleWithCache(url) {
	try {
		const response = await fetch(url, {
			method: 'GET',
			mode: 'cors',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'text/plain',
			},
		})
		const cache = await caches.open('rollup-userscript')
		cache.put(url, response.clone())
		return response
	} catch (error) {
		console.error('rollup-userscript: fetching bundle', error)
		try {
			const cache = await caches.open('rollup-userscript')
			const cachedResponse = await cache.match(url)
			console.log('rollup-userscript: using cached response')
			return cachedResponse
		} catch (error) {
			throw error
		}
	}
}
