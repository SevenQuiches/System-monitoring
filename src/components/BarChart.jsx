import { useEffect, useRef } from 'react';

const BarChart = ({ data, title, color, maxValue = 100 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const targetValues = useRef(data.map(() => 0));
  const currentValues = useRef(data.map(() => 0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 40, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    data.forEach((_, index) => {
      targetValues.current[index] = data[index];
    });

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'right';
        ctx.fillText(`${100 - i * 20}%`, padding.left - 10, y + 4);
      }

      const barWidth = (chartWidth / data.length) * 0.6;
      const barGap = (chartWidth / data.length) * 0.4;

      data.forEach((_, index) => {
        const easing = 0.1;
        currentValues.current[index] += (targetValues.current[index] - currentValues.current[index]) * easing;
        
        const value = currentValues.current[index];
        const barHeight = (value / maxValue) * chartHeight;
        const x = padding.left + index * (barWidth + barGap) + barGap / 2;
        const y = padding.top + chartHeight - barHeight;

        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, adjustColor(color, -30));

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 4);
        ctx.fill();

        ctx.fillStyle = '#f1f5f9';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(`${value.toFixed(1)}%`, x + barWidth / 2, y - 8);
      });

      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(title, width / 2, 25);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data, title, color, maxValue]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

function adjustColor(color, amount) {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default BarChart;
