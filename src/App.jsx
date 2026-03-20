import { useState, useEffect } from 'react';
import { getAllSystemInfo } from './utils/systemInfo';
import BarChart from './components/BarChart';
import LineChart from './components/LineChart';

function App() {
  const [systemInfo, setSystemInfo] = useState({
    cpu: { usage: 0, cores: 0, model: '' },
    memory: { usage: 0, total: '0 B', used: '0 B', free: '0 B' },
    disk: { usage: 0, total: '0 B', used: '0 B', free: '0 B', drive: '' },
  });

  const [historyData, setHistoryData] = useState({
    cpu: [],
    memory: [],
    disk: [],
  });

  useEffect(() => {
    const fetchSystemInfo = () => {
      const info = getAllSystemInfo();
      setSystemInfo(info);
      
      setHistoryData((prev) => ({
        cpu: [...prev.cpu, info.cpu.usage].slice(-30),
        memory: [...prev.memory, info.memory.usage].slice(-30),
        disk: [...prev.disk, info.disk.usage].slice(-30),
      }));
    };

    fetchSystemInfo();
    const interval = setInterval(fetchSystemInfo, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (usage) => {
    if (usage < 50) return 'text-green-400';
    if (usage < 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProgressColor = (usage) => {
    if (usage < 50) return 'bg-green-500';
    if (usage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">系统监控</h1>
          <p className="text-text-muted">实时监控CPU、内存、磁盘使用率</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text">CPU</h3>
              <span className={`text-2xl font-bold ${getStatusColor(systemInfo.cpu.usage)}`}>
                {systemInfo.cpu.usage}%
              </span>
            </div>
            <div className="mb-4">
              <div className="h-2 bg-surface-light rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressColor(systemInfo.cpu.usage)} transition-all duration-500`}
                  style={{ width: `${systemInfo.cpu.usage}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-text-muted">
              {systemInfo.cpu.cores} 核心 · {systemInfo.cpu.model.split(' ')[0]}
            </p>
          </div>

          <div className="bg-surface rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text">内存</h3>
              <span className={`text-2xl font-bold ${getStatusColor(systemInfo.memory.usage)}`}>
                {systemInfo.memory.usage}%
              </span>
            </div>
            <div className="mb-4">
              <div className="h-2 bg-surface-light rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressColor(systemInfo.memory.usage)} transition-all duration-500`}
                  style={{ width: `${systemInfo.memory.usage}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-text-muted">
              已用 {systemInfo.memory.used} / 总计 {systemInfo.memory.total}
            </p>
          </div>

          <div className="bg-surface rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text">磁盘 ({systemInfo.disk.drive})</h3>
              <span className={`text-2xl font-bold ${getStatusColor(systemInfo.disk.usage)}`}>
                {systemInfo.disk.usage}%
              </span>
            </div>
            <div className="mb-4">
              <div className="h-2 bg-surface-light rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressColor(systemInfo.disk.usage)} transition-all duration-500`}
                  style={{ width: `${systemInfo.disk.usage}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-text-muted">
              已用 {systemInfo.disk.used} / 总计 {systemInfo.disk.total}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-surface rounded-xl p-6 border border-border">
            <h3 className="text-lg font-semibold text-text mb-4">实时使用率</h3>
            <div className="h-64">
              <BarChart
                data={[systemInfo.cpu.usage, systemInfo.memory.usage, systemInfo.disk.usage]}
                title=""
                color="#3b82f6"
              />
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cpu" />
                <span className="text-sm text-text-muted">CPU</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-memory" />
                <span className="text-sm text-text-muted">内存</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-disk" />
                <span className="text-sm text-text-muted">磁盘</span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl p-6 border border-border">
            <h3 className="text-lg font-semibold text-text mb-4">CPU 趋势</h3>
            <div className="h-64">
              <LineChart
                data={[systemInfo.cpu.usage]}
                title=""
                color="#3b82f6"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface rounded-xl p-6 border border-border">
            <h3 className="text-lg font-semibold text-text mb-4">内存趋势</h3>
            <div className="h-64">
              <LineChart
                data={[systemInfo.memory.usage]}
                title=""
                color="#10b981"
              />
            </div>
          </div>

          <div className="bg-surface rounded-xl p-6 border border-border">
            <h3 className="text-lg font-semibold text-text mb-4">磁盘趋势</h3>
            <div className="h-64">
              <LineChart
                data={[systemInfo.disk.usage]}
                title=""
                color="#f59e0b"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
