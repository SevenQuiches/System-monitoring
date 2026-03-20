const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require('os');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        backgroundColor: '#1a1a2e',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        titleBarStyle: 'hiddenInset',
        frame: process.platform === 'darwin' ? true : true
    });

    mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
    
    mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

let previousCpuInfo = os.cpus();

function getCpuUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach((cpu, i) => {
        for (let type in cpu.times) {
            totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
    });
    
    let prevTotalIdle = 0;
    let prevTotalTick = 0;
    previousCpuInfo.forEach((cpu, i) => {
        for (let type in cpu.times) {
            prevTotalTick += cpu.times[type];
        }
        prevTotalIdle += cpu.times.idle;
    });
    
    const idleDifference = totalIdle - prevTotalIdle;
    const totalDifference = totalTick - prevTotalTick;
    const usage = 100 - (100 * idleDifference / totalDifference);
    
    previousCpuInfo = cpus;
    
    return Math.max(0, Math.min(100, usage));
}

function getMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const usage = (usedMemory / totalMemory) * 100;
    
    return {
        usage: usage,
        total: totalMemory,
        used: usedMemory,
        free: freeMemory
    };
}

function getDiskUsage() {
    const platform = process.platform;
    
    return new Promise((resolve) => {
        const { exec } = require('child_process');
        
        if (platform === 'win32') {
            exec('wmic logicaldisk get size,freespace,caption', (error, stdout) => {
                if (error) {
                    resolve({ usage: 0, total: 0, used: 0, free: 0 });
                    return;
                }
                
                const lines = stdout.trim().split('\n').slice(1);
                let totalSize = 0;
                let totalFree = 0;
                
                lines.forEach(line => {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 3) {
                        const free = parseInt(parts[0]) || 0;
                        const total = parseInt(parts[1]) || 0;
                        totalSize += total;
                        totalFree += free;
                    }
                });
                
                const totalUsed = totalSize - totalFree;
                const usage = totalSize > 0 ? (totalUsed / totalSize) * 100 : 0;
                
                resolve({
                    usage: usage,
                    total: totalSize,
                    used: totalUsed,
                    free: totalFree
                });
            });
        } else {
            exec('df -k /', (error, stdout) => {
                if (error) {
                    resolve({ usage: 0, total: 0, used: 0, free: 0 });
                    return;
                }
                
                const lines = stdout.trim().split('\n');
                if (lines.length >= 2) {
                    const parts = lines[1].split(/\s+/);
                    const total = parseInt(parts[1]) * 1024;
                    const used = parseInt(parts[2]) * 1024;
                    const free = parseInt(parts[3]) * 1024;
                    const usage = (used / total) * 100;
                    
                    resolve({ usage, total, used, free });
                } else {
                    resolve({ usage: 0, total: 0, used: 0, free: 0 });
                }
            });
        }
    });
}

ipcMain.handle('get-system-stats', async () => {
    const cpuUsage = getCpuUsage();
    const memoryUsage = getMemoryUsage();
    const diskUsage = await getDiskUsage();
    
    return {
        cpu: cpuUsage,
        memory: memoryUsage,
        disk: diskUsage,
        timestamp: Date.now()
    };
});

ipcMain.handle('get-cpu-info', () => {
    const cpus = os.cpus();
    return {
        model: cpus[0].model,
        cores: cpus.length,
        speed: cpus[0].speed
    };
});
