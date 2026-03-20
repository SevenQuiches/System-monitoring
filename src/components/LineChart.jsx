import { useEffect, useRef } from 'react';

const LineChart = ({ data, title, color, maxValue = 100, maxDataPoints = 30 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const displayData = useRef([]);

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

    displayData.current = [...displayData.current, ...data].slice(-maxDataPoints);

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

      if (displayData.current.length > 1) {
        const points = displayData.current.map((value, index) => {
          const x = padding.left + (index / (displayData.current.length - 1)) * chartWidth;
          const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
          return { x, y, value };
        });

        ctx.beginPath();
        ctx.moveTo(points[0].x, padding.top + chartHeight);
        points.forEach((point) => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
        ctx.closePath();
        
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        gradient.addColorStop(0, color + '40');
        gradient.addColorStop(1, color + '05');
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
          const xc = (points[i].x + points[i - 1].x) / 2;
          const yc = (points[i].y + points[i - 1].y) / 2;
          ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
        }
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        points.forEach((point, index) => {
          if (index === points.length - 1) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
            ctx.fillStyle = color + '30';
            ctx.fill();
          }
        });

        if (points.length > 0) {
          const lastPoint = points[points.length - 1];
          ctx.fillStyle = '#f1f5f9';
          ctx.font = 'bold 14px system-ui';
          ctx.textAlign = 'left';
          ctx.fillText(`${lastPoint.value.toFixed(1)}%`, lastPoint.x + 10, lastPoint.y - 10);
        }
      }

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
  }, [data, title, color, maxValue, maxDataPoints]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

export default LineChart;
