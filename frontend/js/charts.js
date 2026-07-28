/* RetailVision AI - Shared Charting Engine */

const Charts = {
    // Canvas-based lightweight sparkline drawer
    drawSparkline(canvas, dataArray, strokeColor = '#06b6d4') {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        // Get layout dimensions
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        const w = rect.width;
        const h = rect.height;
        
        ctx.clearRect(0, 0, w, h);
        if (dataArray.length < 2) return;

        const max = Math.max(...dataArray) || 1;
        const min = Math.min(...dataArray) || 0;
        const range = max - min === 0 ? 1 : max - min;

        // Coordinates mapping
        const points = dataArray.map((val, idx) => {
            const x = (idx / (dataArray.length - 1)) * w;
            const y = h - ((val - min) / range) * (h - 6) - 3; // Keep padding bounds
            return { x, y };
        });

        // Draw fill gradient beneath line
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, strokeColor + '30'); // 18% opacity
        gradient.addColorStop(1, strokeColor + '00'); // Transparent

        ctx.beginPath();
        ctx.moveTo(points[0].x, h);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, h);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();

        // Draw pulse marker at the last dot
        const lastP = points[points.length - 1];
        ctx.beginPath();
        ctx.arc(lastP.x, lastP.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = strokeColor;
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
    },

    // Doughnut distribution chart
    createDoughnutChart(canvasId, labels, data, colors) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: '#1e293b',
                    borderWidth: 2,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#e2e8f0',
                            font: { family: 'Inter', size: 11 },
                            boxWidth: 12
                        }
                    },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        titleColor: '#ffffff',
                        bodyColor: '#cbd5e1',
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false
                    }
                },
                cutout: '70%'
            }
        });
    },

    // Standard Bar Chart
    createBarChart(canvasId, labels, data, datasetLabel, barColor = '#3b82f6') {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        // Vertical linear gradient fill
        const canvasEl = document.getElementById(canvasId);
        const c2d = canvasEl.getContext('2d');
        const gradient = c2d.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, barColor);
        gradient.addColorStop(1, barColor + '20');

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: datasetLabel,
                    data: data,
                    backgroundColor: gradient,
                    borderColor: barColor,
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        titleColor: '#ffffff',
                        bodyColor: '#cbd5e1',
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.04)', drawTicks: false },
                        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
                    }
                }
            }
        });
    },

    // Double Series Area / Line Chart
    createLineChart(canvasId, labels, dataset1, dataset2, label1, label2, color1 = '#06b6d4', color2 = '#8b5cf6') {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: label1,
                        data: dataset1,
                        borderColor: color1,
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        tension: 0.35,
                        pointRadius: 3,
                        pointHoverRadius: 5
                    },
                    {
                        label: label2,
                        data: dataset2,
                        borderColor: color2,
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        tension: 0.35,
                        pointRadius: 3,
                        pointHoverRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#e2e8f0', font: { family: 'Inter', size: 11 } }
                    },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        titleColor: '#ffffff',
                        bodyColor: '#cbd5e1',
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.04)', drawTicks: false },
                        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.04)', drawTicks: false },
                        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
                    }
                }
            }
        });
    }
};
