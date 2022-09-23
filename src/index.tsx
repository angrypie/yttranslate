import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { FloatMenu } from 'components/floating-menu'
import { RecoilRoot } from 'recoil'
import { Captions } from 'components/captions'

const App = () => {
	return (
		<RecoilRoot>
			<MantineProvider withGlobalStyles withNormalizeCSS>
				<>
					<Captions />
					<FloatMenu />
				</>
			</MantineProvider>
		</RecoilRoot>
	)
}

const body = document.body
const app = document.createElement('div')

app.id = 'userscript-app' //TODO replace with app name from config

body.appendChild(app)

const root = createRoot(app) // createRoot(container!) if you use TypeScript
root.render(<App />)
