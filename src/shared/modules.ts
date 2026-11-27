// What the main process tells the page about each installed module.
export interface ModuleInfo {
    id: string
    name: string
    version: string
    // The URL of the module's code, which the page loads with import().
    entry: string
}

// The functions the preload gives the page as window.rabbitdock.
export interface RabbitdockApi {
    listModules(): Promise<ModuleInfo[]>
}

export const LIST_MODULES_CHANNEL = 'modules:list'
