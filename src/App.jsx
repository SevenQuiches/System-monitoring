const { useState, useEffect, useRef, useCallback } = React;

const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const Card = ({ title, value, subtitle, children, gradient }) => {
    return (
        <div className="card" style={{ background: gradient }}>
            <div className="card-header">
                <h3 className="card-title">{title}</h3>
                <div className="card-value">{value}</div>
                {subtitle && <div className="card-subtitle">{subtitle}</div>}
            </div>
            <div className="card-content">
                {children}
            </div>
        </div>
    );
};

const BarChart = ({ data, width, height, color }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const currentValuesRef = useRef(data.map(() => 0));
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);
        
        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            
            const padding = 20;
            const chartWidth = width - padding * 2;
            const chartHeight = height - padding * 2;
            const barCount = data.length;
            const barWidth = (chartWidth / barCount) * 0.6;
            const gap = (chartWidth / barCount) * 0.4;
            
            data.forEach((item, index) => {
                const targetValue = item.value;
                currentValuesRef.current[index] += (targetValue - currentValuesRef.current[index]) * 0.1;
                
                const barHeight = (currentValuesRef.current[index] / 100) * chartHeight;
                const x = padding + index * (barWidth + gap) + gap / 2;
                const y = height - padding - barHeight;
                
                const gradient = ctx.createLinearGradient(x, y, x, height - padding);
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, color + '40');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                const radius = Math.min(4, barWidth / 2);
                ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
                ctx.fill();
                
                ctx.fillStyle = '#888';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(item.label, x + barWidth / 2, height - 5);
            });
            
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding, padding);
            ctx.lineTo(padding, height - padding);
            ctx.lineTo(width - padding, height - padding);
            ctx.stroke();
            
            for (let i = 0; i <= 4; i++) {
                const y = padding + (chartHeight / 4) * i;
                ctx.strokeStyle = '#333';
                ctx.beginPath();
                ctx.moveTo(padding - 5, y);
                ctx.lineTo(width - padding, y);
                ctx.stroke();
                
                ctx.fillStyle = '#666';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText((100 - i * 25) + '%', padding - 8, y + 3);
            }
            
            animationRef.current = requestAnimationFrame(animate);
        };
        
        animate();
        
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [data, width, height, color]);
    
    return <canvas ref={canvasRef} />;
};

const LineChart = ({ data, width, height, color, label }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const dataHistoryRef = useRef([]);
    const maxDataPoints = 60;
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);
        
        if (data.length > 0) {
            const newPoint = data[data.length - 1];
            dataHistoryRef.current.push(newPoint.value);
            if (dataHistoryRef.current.length > maxDataPoints) {
                dataHistoryRef.current.shift();
            }
        }
        
        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            
            const padding = { top: 20, right: 20, bottom: 30, left: 40 };
            const chartWidth = width - padding.left - padding.right;
            const chartHeight = height - padding.top - padding.bottom;
            
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding.left, padding.top);
            ctx.lineTo(padding.left, height - padding.bottom);
            ctx.lineTo(width - padding.right, height - padding.bottom);
            ctx.stroke();
            
            for (let i = 0; i <= 4; i++) {
                const y = padding.top + (chartHeight / 4) * i;
                ctx.strokeStyle = '#2a2a4a';
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(width - padding.right, y);
                ctx.stroke();
                
                ctx.fillStyle = '#666';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText((100 - i * 25) + '%', padding.left - 8, y + 3);
            }
            
            const history = dataHistoryRef.current;
            if (history.length > 1) {
                const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
                gradient.addColorStop(0, color + '60');
                gradient.addColorStop(1, color + '05');
                
                ctx.beginPath();
                ctx.moveTo(padding.left, height - padding.bottom);
                
                history.forEach((value, index) => {
                    const x = padding.left + (index / (maxDataPoints - 1)) * chartWidth;
                    const y = padding.top + (1 - value / 100) * chartHeight;
                    
                    if (index === 0) {
                        ctx.lineTo(x, y);
                    } else {
                        const prevX = padding.left + ((index - 1) / (maxDataPoints - 1)) * chartWidth;
                        const prevY = padding.top + (1 - history[index - 1] / 100) * chartHeight;
                        const cpX = (prevX + x) / 2;
                        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
                    }
                });
                
                ctx.lineTo(padding.left + ((history.length - 1) / (maxDataPoints - 1)) * chartWidth, height - padding.bottom);
                ctx.closePath();
                ctx.fillStyle = gradient;
                ctx.fill();
                
                ctx.beginPath();
                history.forEach((value, index) => {
                    const x = padding.left + (index / (maxDataPoints - 1)) * chartWidth;
                    const y = padding.top + (1 - value / 100) * chartHeight;
                    
                    if (index === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        const prevX = padding.left + ((index - 1) / (maxDataPoints - 1)) * chartWidth;
                        const prevY = padding.top + (1 - history[index - 1] / 100) * chartHeight;
                        const cpX = (prevX + x) / 2;
                        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
                    }
                });
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.stroke();
                
                if (history.length > 0) {
                    const lastX = padding.left + ((history.length - 1) / (maxDataPoints - 1)) * chartWidth;
                    const lastY = padding.top + (1 - history[history.length - 1] / 100) * chartHeight;
                    
                    ctx.beginPath();
                    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.fill();
                    
                    ctx.beginPath();
                    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
                    ctx.fillStyle = '#1a1a2e';
                    ctx.fill();
                }
            }
            
            ctx.fillStyle = '#888';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('时间 (秒)', width / 2, height - 5);
            
            animationRef.current = requestAnimationFrame(animate);
        };
        
        animate();
        
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [data, width, height, color]);
    
    return <canvas ref={canvasRef} />;
};

const CircularProgress = ({ value, size, strokeWidth, color }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const currentValueRef = useRef(0);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        ctx.scale(dpr, dpr);
        
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = (size - strokeWidth) / 2;
        
        const animate = () => {
            currentValueRef.current += (value - currentValueRef.current) * 0.08;
            
            ctx.clearRect(0, 0, size, size);
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = '#2a2a4a';
            ctx.lineWidth = strokeWidth;
            ctx.stroke();
            
            const gradient = ctx.createLinearGradient(0, 0, size, size);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, color + 'aa');
            
            ctx.beginPath();
            ctx.arc(
                centerX, 
                centerY, 
                radius, 
                -Math.PI / 2, 
                -Math.PI / 2 + (currentValueRef.current / 100) * Math.PI * 2
            );
            ctx.strokeStyle = gradient;
            ctx.lineWidth = strokeWidth;
            ctx.lineCap = 'round';
            ctx.stroke();
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(Math.round(currentValueRef.current) + '%', centerX, centerY);
            
            animationRef.current = requestAnimationFrame(animate);
        };
        
        animate();
        
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [value, size, strokeWidth, color]);
    
    return <canvas ref={canvasRef} />;
};

const App = () => {
    const [stats, setStats] = useState({
        cpu: { usage: 0 },
        memory: { usage: 0, total: 0, used: 0, free: 0 },
        disk: { usage: 0, total: 0, used: 0, free: 0 }
    });
    const [cpuHistory, setCpuHistory] = useState([]);
    const [memoryHistory, setMemoryHistory] = useState([]);
    const [diskHistory, setDiskHistory] = useState([]);
    const [cpuInfo, setCpuInfo] = useState({ model: 'Unknown', cores: 0 });
    
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await window.electronAPI.getSystemStats();
                setStats(data);
                
                setCpuHistory(prev => [...prev, { value: data.cpu, timestamp: data.timestamp }]);
                setMemoryHistory(prev => [...prev, { value: data.memory.usage, timestamp: data.timestamp }]);
                setDiskHistory(prev => [...prev, { value: data.disk.usage, timestamp: data.timestamp }]);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            }
        };
        
        const fetchCpuInfo = async () => {
            try {
                const info = await window.electronAPI.getCpuInfo();
                setCpuInfo(info);
            } catch (error) {
                console.error('Failed to fetch CPU info:', error);
            }
        };
        
        fetchCpuInfo();
        fetchStats();
        
        const interval = setInterval(fetchStats, 1000);
        
        return () => clearInterval(interval);
    }, []);
    
    const cpuBarData = [
        { label: 'CPU', value: typeof stats.cpu === 'number' ? stats.cpu : stats.cpu.usage || 0 }
    ];
    
    const memoryBarData = [
        { label: 'RAM', value: stats.memory.usage }
    ];
    
    const diskBarData = [
        { label: 'Disk', value: stats.disk.usage }
    ];
    
    return (
        <div className="app">
            <header className="header">
                <h1 className="header-title">系统监控面板</h1>
                <div className="header-info">
                    <span>{cpuInfo.model}</span>
                    <span className="divider">|</span>
                    <span>{cpuInfo.cores} 核心</span>
                </div>
            </header>
            
            <main className="main">
                <div className="grid">
                    <Card 
                        title="CPU 使用率" 
                        value={typeof stats.cpu === 'number' ? stats.cpu.toFixed(1) + '%' : (stats.cpu.usage || 0).toFixed(1) + '%'}
                        gradient="linear-gradient(135deg, #1e3a5f 0%, #1a1a2e 100%)"
                    >
                        <div className="card-body">
                            <div className="chart-row">
                                <CircularProgress 
                                    value={typeof stats.cpu === 'number' ? stats.cpu : stats.cpu.usage || 0} 
                                    size={120} 
                                    strokeWidth={10} 
                                    color="#4fc3f7" 
                                />
                                <div className="bar-chart-container">
                                    <BarChart 
                                        data={cpuBarData} 
                                        width={200} 
                                        height={150} 
                                        color="#4fc3f7" 
                                    />
                                </div>
                            </div>
                            <div className="line-chart-container">
                                <LineChart 
                                    data={cpuHistory} 
                                    width={380} 
                                    height={120} 
                                    color="#4fc3f7"
                                    label="CPU"
                                />
                            </div>
                        </div>
                    </Card>
                    
                    <Card 
                        title="内存使用率" 
                        value={stats.memory.usage.toFixed(1) + '%'}
                        subtitle={`已用: ${formatBytes(stats.memory.used)} / 总计: ${formatBytes(stats.memory.total)}`}
                        gradient="linear-gradient(135deg, #2d1f3d 0%, #1a1a2e 100%)"
                    >
                        <div className="card-body">
                            <div className="chart-row">
                                <CircularProgress 
                                    value={stats.memory.usage} 
                                    size={120} 
                                    strokeWidth={10} 
                                    color="#ba68c8" 
                                />
                                <div className="bar-chart-container">
                                    <BarChart 
                                        data={memoryBarData} 
                                        width={200} 
                                        height={150} 
                                        color="#ba68c8" 
                                    />
                                </div>
                            </div>
                            <div className="line-chart-container">
                                <LineChart 
                                    data={memoryHistory} 
                                    width={380} 
                                    height={120} 
                                    color="#ba68c8"
                                    label="Memory"
                                />
                            </div>
                        </div>
                    </Card>
                    
                    <Card 
                        title="磁盘使用率" 
                        value={stats.disk.usage.toFixed(1) + '%'}
                        subtitle={`已用: ${formatBytes(stats.disk.used)} / 总计: ${formatBytes(stats.disk.total)}`}
                        gradient="linear-gradient(135deg, #1f3d2d 0%, #1a1a2e 100%)"
                    >
                        <div className="card-body">
                            <div className="chart-row">
                                <CircularProgress 
                                    value={stats.disk.usage} 
                                    size={120} 
                                    strokeWidth={10} 
                                    color="#81c784" 
                                />
                                <div className="bar-chart-container">
                                    <BarChart 
                                        data={diskBarData} 
                                        width={200} 
                                        height={150} 
                                        color="#81c784" 
                                    />
                                </div>
                            </div>
                            <div className="line-chart-container">
                                <LineChart 
                                    data={diskHistory} 
                                    width={380} 
                                    height={120} 
                                    color="#81c784"
                                    label="Disk"
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            </main>
            
            <footer className="footer">
                <span>实时刷新间隔: 1秒</span>
                <span className="divider">|</span>
                <span>数据点: {cpuHistory.length}</span>
            </footer>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
