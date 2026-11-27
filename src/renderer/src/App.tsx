import { use, useState } from 'react'
import styles from './App.module.css'
import { installedModules } from './modules'
import { ModuleView } from './ModuleView'

export function App() {
    const modules = use(installedModules)
    const [selectedId, setSelectedId] = useState<string>()
    const selected = modules.find((module) => module.id === selectedId)

    return (
        <div className={styles.shell}>
            <aside className={styles.sidebar}>
                <h1 className={styles.brand}>RabbitDock</h1>
                {modules.length > 0 && (
                    <nav aria-label="Modules">
                        <ul className={styles.moduleList}>
                            {modules.map((module) => (
                                <li key={module.id}>
                                    <button
                                        type="button"
                                        className={styles.moduleButton}
                                        aria-current={module.id === selectedId ? 'page' : undefined}
                                        onClick={() => setSelectedId(module.id)}
                                    >
                                        {module.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                )}
            </aside>
            <main className={styles.content}>
                {selected ? (
                    // The key gives each module its own page state and error boundary.
                    <ModuleView key={selected.id} module={selected} />
                ) : (
                    <p className={styles.placeholder}>
                        {modules.length === 0 ? 'No modules installed yet.' : 'Choose a module in the sidebar.'}
                    </p>
                )}
            </main>
        </div>
    )
}
