import './host'
import './global.css'
import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

const container = document.getElementById('root')
if (!container) throw new Error('Missing #root element')

// App waits for the list of installed modules, which comes from the main process.
createRoot(container).render(
    <StrictMode>
        <Suspense>
            <App />
        </Suspense>
    </StrictMode>,
)
