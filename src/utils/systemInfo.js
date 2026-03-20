import os from 'os';
import { execSync } from 'child_process';

let lastCPUInfo = null;

export function getCPUUsage() {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach((cpu) => {
    for (let type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });

  const currentIdle = totalIdle / cpus.length;
  const currentTotal = totalTick / cpus.length;
  
  let usage = 0;
  if (lastCPUInfo) {
    const idleDiff = currentIdle - lastCPUInfo.idle;
    const totalDiff = currentTotal - lastCPUInfo.total;
    usage = totalDiff > 0 ? 100 - Math.round((100 * idleDiff) / totalDiff) : 0;
  }
  
  lastCPUInfo = {
    idle: currentIdle,
    total: currentTotal,
  };

  return {
    usage: Math.max(0, Math.min(100, usage)),
    cores: cpus.length,
    model: cpus[0].model,
  };
}

export function getMemoryInfo() {
  try {
    let usedMem, freeMem, totalMem;
    
    if (process.platform === 'win32') {
      const output = execSync('wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /format:list', { encoding: 'utf8' });
      let totalKb = 0, freeKb = 0;
      
      output.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('TotalVisibleMemorySize=')) {
          totalKb = parseInt(trimmed.split('=')[1]);
        } else if (trimmed.startsWith('FreePhysicalMemory=')) {
          freeKb = parseInt(trimmed.split('=')[1]);
        }
      });
      
      if (totalKb > 0) {
        totalMem = totalKb * 1024;
        freeMem = freeKb * 1024;
        usedMem = totalMem - freeMem;
      } else {
        throw new Error('Failed to get memory info from wmic');
      }
    } else if (process.platform === 'darwin') {
      const output = execSync('vm_stat', { encoding: 'utf8' });
      const pageSize = 4096;
      let freePages = 0, activePages = 0, inactivePages = 0, speculativePages = 0, wiredPages = 0;
      
      output.split('\n').forEach(line => {
        if (line.includes('Pages free:')) freePages = parseInt(line.match(/\d+/)[0]);
        if (line.includes('Pages active:')) activePages = parseInt(line.match(/\d+/)[0]);
        if (line.includes('Pages inactive:')) inactivePages = parseInt(line.match(/\d+/)[0]);
        if (line.includes('Pages speculative:')) speculativePages = parseInt(line.match(/\d+/)[0]);
        if (line.includes('Pages wired down:')) wiredPages = parseInt(line.match(/\d+/)[0]);
      });
      
      totalMem = os.totalmem();
      usedMem = (activePages + wiredPages) * pageSize;
      freeMem = totalMem - usedMem;
    } else {
      totalMem = os.totalmem();
      freeMem = os.freemem();
      usedMem = totalMem - freeMem;
    }
    
    const usage = parseFloat(((usedMem / totalMem) * 100).toFixed(1));
    
    return {
      usage: Math.max(0, Math.min(100, usage)),
      total: formatBytes(totalMem),
      used: formatBytes(usedMem),
      free: formatBytes(freeMem),
    };
  } catch (error) {
    console.error('Error getting memory info:', error);
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usage = parseFloat(((usedMem / totalMem) * 100).toFixed(1));
    
    return {
      usage: Math.max(0, Math.min(100, usage)),
      total: formatBytes(totalMem),
      used: formatBytes(usedMem),
      free: formatBytes(freeMem),
    };
  }
}

export function getDiskInfo() {
  try {
    const drives = [];
    
    if (process.platform === 'win32') {
      const output = execSync('wmic logicaldisk get size,freespace,caption', { encoding: 'utf8' });
      const lines = output.trim().split('\n').slice(1);
      
      lines.forEach((line) => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
          const caption = parts[0];
          const freeSpace = parseInt(parts[1]);
          const size = parseInt(parts[2]);
          
          if (size > 0) {
            const used = size - freeSpace;
            const usage = ((used / size) * 100).toFixed(1);
            
            drives.push({
              drive: caption,
              usage: parseFloat(usage),
              total: formatBytes(size),
              used: formatBytes(used),
              free: formatBytes(freeSpace),
            });
          }
        }
      });
    } else {
      const output = execSync('df -h', { encoding: 'utf8' });
      const lines = output.trim().split('\n').slice(1);
      
      lines.forEach((line) => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 6 && parts[0].startsWith('/')) {
          const usage = parseFloat(parts[4].replace('%', ''));
          
          drives.push({
            drive: parts[5],
            usage,
            total: parts[1],
            used: parts[2],
            free: parts[3],
          });
        }
      });
    }
    
    return drives.length > 0 ? drives[0] : { usage: 0, total: '0B', used: '0B', free: '0B', drive: 'N/A' };
  } catch (error) {
    console.error('Error getting disk info:', error);
    return { usage: 0, total: '0B', used: '0B', free: '0B', drive: 'N/A' };
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getAllSystemInfo() {
  return {
    cpu: getCPUUsage(),
    memory: getMemoryInfo(),
    disk: getDiskInfo(),
    timestamp: Date.now(),
  };
}
