const entryPoint = './src/index.tsx'
const outDir = './dist'

require('esbuild')
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

require('esbuild')
	.serve(
		{
			servedir: outDir,
			port: 9111,
		},
		{
			entryPoints: [entryPoint],
			outdir: outDir,
			bundle: true,
		}
	)
	.then(server => {
		console.log('Serving directory:', outDir, 'on port:', server.port)
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
