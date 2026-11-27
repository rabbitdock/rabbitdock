import { Component, Suspense, type ReactNode } from 'react'
import type { ModuleInfo } from '../../shared/modules'
import { modulePage } from './modules'
import styles from './ModuleView.module.css'

// Shows an installed module's page. When a module fails to load or throws, only its page turns
// into a message and the rest of the app keeps working.
export function ModuleView({ module }: { module: ModuleInfo }) {
    const Page = modulePage(module)
    return (
        <ModuleBoundary name={module.name}>
            <Suspense fallback={<p className={styles.status}>Loading {module.name}...</p>}>
                <Page />
            </Suspense>
        </ModuleBoundary>
    )
}

// React only catches render errors in a class component.
class ModuleBoundary extends Component<{ name: string; children: ReactNode }, { failed: boolean }> {
    state = { failed: false }

    static getDerivedStateFromError() {
        return { failed: true }
    }

    render() {
        if (this.state.failed) {
            return (
                <p className={styles.status} role="alert">
                    {this.props.name} failed to load.
                </p>
            )
        }
        return this.props.children
    }
}
