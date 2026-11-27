import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { ModuleInfo, RabbitdockApi } from '../../shared/modules'

declare global {
    interface Window {
        // Set by src/preload/index.ts.
        rabbitdock: RabbitdockApi
    }
}

// The main process reads the installed modules once at startup, so the list is asked for once.
export const installedModules: Promise<ModuleInfo[]> = window.rabbitdock.listModules()

const pages = new Map<string, LazyExoticComponent<ComponentType>>()

// Returns the module's page, which loads the module's code the first time it renders. The page is
// kept, so coming back to a module does not load its code again.
export function modulePage(module: ModuleInfo): LazyExoticComponent<ComponentType> {
    let page = pages.get(module.id)
    if (!page) {
        page = lazy(async () => {
            const { default: exported } = (await import(/* @vite-ignore */ module.entry)) as { default?: unknown }
            // A page is a function component or one of the objects that memo and forwardRef return.
            // An object that only looks like one makes React throw on render, which the boundary catches.
            const isPage = typeof exported === 'function' || (typeof exported === 'object' && exported !== null && '$$typeof' in exported)
            if (!isPage) throw new Error(`The module ${module.id} does not export a page`)
            return { default: exported as ComponentType }
        })
        pages.set(module.id, page)
    }
    return page
}
