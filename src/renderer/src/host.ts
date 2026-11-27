import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as jsxRuntime from 'react/jsx-runtime'

declare global {
    // Modules use this copy of React instead of bundling their own, see scripts/build-module.mts.
    var __rabbitdockHost: { react: typeof React; jsxRuntime: typeof jsxRuntime; reactDom: typeof ReactDOM }
}

globalThis.__rabbitdockHost = { react: React, jsxRuntime, reactDom: ReactDOM }
