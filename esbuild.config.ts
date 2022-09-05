const http = require('http')
const esbuild = require('esbuild')

const entryPoint = './src/index.tsx'
const outDir = './dist'

esbuild
	.build({
		entryPoints: [entryPoint],
		outfile: `${outDir}/dev.bundle.js`,
		jsx: 'automatic',
		bundle: true,
		minify: true,
		watch: {
			onRebuild(error, result) {
				if (error) console.error('watch build failed:', error)
				else console.log('watch build succeeded:', JSON.stringify(result))
			},
		},
		plugins: [appendUserscriptPlugin()],
	})
	.then(() => {
		console.log('watching...')
	})

esbuild
	.serve(
		{
			servedir: outDir,
			port: 9110,
		},
		{
			entryPoints: [entryPoint],
			outdir: outDir,
			bundle: true,
		}
	)
	.then(result => {
		// The result tells us where esbuild's local server is
		const { host, port } = result

		// Then start a proxy server on port 3000
		http
			.createServer((req, res) => {
				const options = {
					hostname: host,
					port: port,
					path: req.url,
					method: req.method,
					headers: req.headers,
				}

				// Forward each incoming request to esbuild
				const proxyReq = http.request(options, proxyRes => {
					//if file name end with .gz then add content-encoding header
					if (req.url?.endsWith('.gz')) {
						res.setHeader('content-encoding', 'gzip')
					}
					// Otherwise, forward the response from esbuild to the client
					res.writeHead(proxyRes.statusCode, proxyRes.headers)
					proxyRes.pipe(res, { end: true })
				})
				// Forward the body of the request to esbuild
				req.pipe(proxyReq, { end: true })
			})
			.listen(9111)
	})

function appendUserscriptPlugin() {
	return {
		name: 'appendUserscriptPlugin',
		setup: build => {
			const options = build.initialOptions
			options.banner = {
				...options.banner,
				js: generateUserscriptHeader().concat(options.banner?.js ?? ''),
			}
		},
	}
}

function generateUserscriptHeader() {
	//TODO use config to create metadata
	return `// ==UserScript==
// @name        react-userscript-template [dev]
// @description Create userscripts with React.js using live-reload and instand build time (esbuild)
// @include     *.youtube.com/*
// @version     0.0.1
// @inject-into page
// ==/UserScript==
`
}
