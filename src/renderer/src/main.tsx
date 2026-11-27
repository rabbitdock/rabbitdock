import './host'
import './global.css'
import { CSPProvider } from '@base-ui/react/csp-provider'
import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

const container = document.getElementById('root')
if (!container) throw new Error('Missing #root element')

// The Content-Security-Policy blocks inline <style> tags, so Base UI must not create any, and
// global.css provides the rules it would add. App waits for the list of installed modules, which
// comes from the main process.
createRoot(container).render(
    <StrictMode>
        <CSPProvider disableStyleElements>
            <Suspense>
                <App />
            </Suspense>
        </CSPProvider>
    </StrictMode>,
)
