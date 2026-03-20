const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getSystemStats: () => ipcRenderer.invoke('get-system-stats'),
    getCpuInfo: () => ipcRenderer.invoke('get-cpu-info')
});
