import React, { useState, useEffect, useRef } from 'react';
import { getComponentLogger } from '../../utils/logger';
import type { PerformanceHistory, PerformanceChartsProps } from '../../types/performance';
import performanceService from '../../services/performanceService';

const logger = getComponentLogger('PerformanceCharts');

const PerformanceCharts: React.FC<PerformanceChartsProps> = ({
  timeRange = '24h',
  metrics = ['responseTime', 'cacheHitRate', 'activeRequests'],
  height = 400
}) => {
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>(metrics[0]);
  const chartRef = useRef<HTMLCanvasElement | null>(null);

  // Fetch performance history data
  const fetchPerformanceHistory = async () => {
    try {
      setError(null);
      const history = await performanceService.getPerformanceHistory(timeRange || '24h');
      setPerformanceHistory(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch performance history');
      logger.error('Performance history error', { error: err.message }, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceHistory();
  }, [timeRange]);

  // Simple chart rendering function (without external dependencies)
  const renderChart = () => {
    if (!performanceHistory || !chartRef.current) {
      return;
    }

    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const data = performanceHistory.dataPoints;
    if (data.length === 0) {
      return;
    }

    // Chart dimensions
    const padding = 60;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;

    // Get data for selected metric
    let values: number[] = [];
    let label = '';
    let color = '#3b82f6';

    switch (selectedMetric) {
      case 'responseTime':
        values = data.map(d => d.responseTime);
        label = 'Response Time (ms)';
        color = '#3b82f6';
        break;
      case 'cacheHitRate':
        values = data.map(d => d.cacheHitRate * 100);
        label = 'Cache Hit Rate (%)';
        color = '#10b981';
        break;
      case 'activeRequests':
        values = data.map(d => d.activeRequests);
        label = 'Active Requests';
        color = '#8b5cf6';
        break;
      case 'systemLoad':
        values = data.map(d => d.systemLoad || 0);
        label = 'System Load';
        color = '#f59e0b';
        break;
    }

    if (values.length === 0) {
      return;
    }

    // Calculate scales
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    // Vertical grid lines
    const timeSteps = Math.min(data.length, 10);
    for (let i = 0; i <= timeSteps; i++) {
      const x = padding + (chartWidth * i) / timeSteps;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + chartHeight);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();

    // Draw data line
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();

    values.forEach((value, index) => {
      const x = padding + (chartWidth * index) / (values.length - 1);
      const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw data points
    ctx.fillStyle = color;
    values.forEach((value, index) => {
      const x = padding + (chartWidth * index) / (values.length - 1);
      const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = '#374151';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';

    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = maxValue - (valueRange * i) / 5;
      const y = padding + (chartHeight * i) / 5;
      ctx.fillText(value.toFixed(selectedMetric === 'cacheHitRate' ? 1 : 0), padding - 10, y + 4);
    }

    // X-axis labels (time)
    ctx.textAlign = 'center';
    const labelStep = Math.max(1, Math.floor(data.length / 6));
    data.forEach((point, index) => {
      if (index % labelStep === 0) {
        const x = padding + (chartWidth * index) / (values.length - 1);
        const time = new Date(point.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        ctx.fillText(time, x, padding + chartHeight + 20);
      }
    });

    // Chart title
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(label, padding + chartWidth / 2, 30);
  };

  useEffect(() => {
    if (performanceHistory) {
      // Small delay to ensure canvas is ready
      setTimeout(renderChart, 100);
    }
  }, [performanceHistory, selectedMetric]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        const canvas = chartRef.current;
        const container = canvas.parentElement;
        if (container) {
          canvas.width = container.clientWidth;
          canvas.height = height;
          renderChart();
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [height]);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-red-600">
          <p>Error loading performance charts: {error}</p>
          <button 
            onClick={fetchPerformanceHistory}
            className="mt-2 text-sm text-blue-600 underline hover:text-blue-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Performance Charts
          </h3>
          <div className="flex items-center space-x-4">
            {/* Metric Selector */}
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              {metrics.includes('responseTime') && (
                <option value="responseTime">Response Time</option>
              )}
              {metrics.includes('cacheHitRate') && (
                <option value="cacheHitRate">Cache Hit Rate</option>
              )}
              {metrics.includes('activeRequests') && (
                <option value="activeRequests">Active Requests</option>
              )}
              {metrics.includes('systemLoad') && (
                <option value="systemLoad">System Load</option>
              )}
            </select>

            {/* Time Range Info */}
            <span className="text-sm text-gray-500">
              Last {timeRange}
            </span>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="relative" style={{ height: `${height}px` }}>
          <canvas
            ref={chartRef}
            className="w-full h-full"
            style={{ height: `${height}px` }}
          />
        </div>

        {/* Performance Trends */}
        {performanceHistory && performanceHistory.trends && performanceHistory.trends.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-md font-medium text-gray-900 mb-3">Performance Trends</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {performanceHistory.trends.slice(0, 3).map((trend, index) => (
                <div key={index} className="text-center">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    trend.direction === 'improving' ? 'bg-green-100 text-green-800' :
                    trend.direction === 'stable' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {trend.direction === 'improving' && (
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                      </svg>
                    )}
                    {trend.direction === 'degrading' && (
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                      </svg>
                    )}
                    {trend.direction === 'stable' && (
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    )}
                    {trend.direction}
                  </div>
                  <div className="text-sm font-medium text-gray-900 mt-1 capitalize">
                    {trend.metric.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {trend.changePercentage > 0 ? '+' : ''}{trend.changePercentage.toFixed(1)}% ({trend.timeframe})
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chart Legend */}
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            Response Time
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            Cache Hit Rate
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
            Active Requests
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            System Load
          </div>
        </div>

        {/* Data Summary */}
        {performanceHistory && performanceHistory.dataPoints.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing {performanceHistory.dataPoints.length} data points over {performanceHistory.timeRange}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceCharts;
