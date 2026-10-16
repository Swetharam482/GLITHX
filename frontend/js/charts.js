/* RetailVision AI - Shared Charting Engine (Light White & Orange Theme) */

const Charts = {
    // Canvas-based lightweight sparkline drawer
    drawSparkline(canvas, dataArray, strokeColor = '#F97316') {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        const w = rect.width;
        const h = rect.height;
        
        ctx.clearRect(0, 0, w, h);
        if (!dataArray || dataArray.length < 2) return;

        const max = Math.max(...dataArray) || 1;
        const min = Math.min(...dataArray) || 0;
        const range = max - min === 0 ? 1 : max - min;

        const points = dataArray.map((val, idx) => {
            const x = (idx / (dataArray.length - 1)) * w;
            const y = h - ((val - min) / range) * (h - 8) - 4;
            return { x, y };
        });

        // Draw soft fill gradient beneath line
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, strokeColor + '30');
        gradient.addColorStop(1, strokeColor + '00');

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
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();

        // Marker at last dot
        const lastP = points[points.length - 1];
        ctx.beginPath();
        ctx.arc(lastP.x, lastP.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = strokeColor;
        ctx.fill();
    },

    // Doughnut distribution chart
    createDoughnutChart(canvasId, labels, data, colors) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const defaultColors = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B'];
        const palette = colors || defaultColors;

        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: palette,
                    borderColor: '#FFFFFF',
                    borderWidth: 2,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#475569',
                            font: { family: 'Inter', size: 11, weight: '500' },
                            boxWidth: 12,
                            padding: 12
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1E293B',
                        titleColor: '#FFFFFF',
                        bodyColor: '#F8FAFC',
                        borderColor: '#CBD5E1',
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 8
                    }
                },
                cutout: '72%'
            }
        });
    },

    // Bar chart for shelf analytics & dwell times
    createBarChart(canvasId, labels, data, labelTitle = 'Shopper Visits', primaryColor = '#F97316') {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: labelTitle,
                    data: data,
                    backgroundColor: primaryColor,
                    borderRadius: 6,
                    borderSkipped: false,
                    maxBarThickness: 36
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1E293B',
                        titleColor: '#FFFFFF',
                        bodyColor: '#F8FAFC',
                        borderColor: '#E2E8F0',
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#64748B',
                            font: { family: 'Inter', size: 11 }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#F1F5F9'
                        },
                        ticks: {
                            color: '#64748B',
                            font: { family: 'Inter', size: 11 },
                            precision: 0
                        }
                    }
                }
            }
        });
    },

    // Line chart for traffic timelines & flow
    createLineChart(canvasId, labels, data, labelTitle = 'Shoppers in View', primaryColor = '#F97316') {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: labelTitle,
                    data: data,
                    borderColor: primaryColor,
                    backgroundColor: primaryColor + '20',
                    fill: true,
                    tension: 0.35,
                    borderWidth: 2,
                    pointBackgroundColor: primaryColor,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1E293B',
                        titleColor: '#FFFFFF',
                        bodyColor: '#F8FAFC',
                        borderColor: '#E2E8F0',
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#64748B',
                            font: { family: 'Inter', size: 11 }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: '#F1F5F9' },
                        ticks: {
                            color: '#64748B',
                            font: { family: 'Inter', size: 11 },
                            precision: 0
                        }
                    }
                }
            }
        });
    }
};

