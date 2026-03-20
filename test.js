import { getCPUUsage, getMemoryInfo, getDiskInfo } from './src/utils/systemInfo.js';

console.log('Testing system info functions...\n');

// Test CPU usage
console.log('CPU Test:');
const cpu1 = getCPUUsage();
console.log('Initial CPU:', cpu1);

setTimeout(() => {
  const cpu2 = getCPUUsage();
  console.log('CPU after 1 second:', cpu2);
  console.log('');
  
  // Test Memory
  console.log('Memory Test:');
  const memory = getMemoryInfo();
  console.log('Memory:', memory);
  console.log('');
  
  // Test Disk
  console.log('Disk Test:');
  const disk = getDiskInfo();
  console.log('Disk:', disk);
  console.log('');
  
  console.log('Test complete!');
}, 1000);
