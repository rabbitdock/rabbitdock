import { cn } from 'cn'
import { use, useState } from 'react'
import { Button } from '@/components/ui/button'
import { installedModules } from './modules'
import { ModuleView } from './ModuleView'

export function App() {
    const modules = use(installedModules)
    const [selectedId, setSelectedId] = useState<string>()
    const selected = modules.find((module) => module.id === selectedId)

    return (
        <div className="grid h-full grid-cols-[220px_1fr]">
            <aside className="overflow-y-auto border-r border-border bg-sidebar px-3 py-4">
                <h1 className="px-2 text-[15px] font-semibold">RabbitDock</h1>
                {modules.length > 0 && (
                    <nav aria-label="Modules">
                        <ul className="mt-4 grid gap-0.5">
                            {modules.map((module) => {
                                const current = module.id === selectedId
                                return (
                                    <li key={module.id}>
                                        <Button
                                            variant="ghost"
                                            className={cn('w-full justify-start px-2 font-normal', current && 'bg-selection font-medium hover:bg-selection')}
                                            aria-current={current ? 'page' : undefined}
                                            onClick={() => setSelectedId(module.id)}
                                        >
                                            {module.name}
                                        </Button>
                                    </li>
                                )
                            })}
                        </ul>
                    </nav>
                )}
            </aside>
            <main className="overflow-auto">
                {selected ? (
                    // The key gives each module its own page state and error boundary.
                    <ModuleView key={selected.id} module={selected} />
                ) : (
                    <p className="grid h-full place-items-center text-muted-foreground">
                        {modules.length === 0 ? 'No modules installed yet.' : 'Choose a module in the sidebar.'}
                    </p>
                )}
            </main>
        </div>
    )
}
