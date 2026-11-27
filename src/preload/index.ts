import { contextBridge, ipcRenderer } from 'electron'
import { LIST_MODULES_CHANNEL, type RabbitdockApi } from '../shared/modules'

// The page reaches the main process only through these functions, each of which sends one fixed
// message, so the page cannot pick the channel or reach ipcRenderer itself.
const api: RabbitdockApi = {
    listModules: () => ipcRenderer.invoke(LIST_MODULES_CHANNEL),
}

contextBridge.exposeInMainWorld('rabbitdock', api)
