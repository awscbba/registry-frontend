import React, { useState, useEffect, useRef } from 'react';
import type { 
  RealTimePerformanceProps, 
  PerformanceStreamData, 
  WebSocketConnectionStatus,
  RealTimeChartData 
} from '../../types/websocket';
import webSocketService from '../../services/webSocketService';

const RealTimePerformanceMonitor: React.FC<RealTimePerformanceProps> = ({
  autoConnect = true,
  showConnectionStatus = true,
  updateInterval = 1000,
  maxDataPoints = 60
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<WebSocketConnectionStatus | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceStreamData[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceStreamData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (autoConnect) {
      connectToStream();
    }

    return () => {
      webSocketService.disconnect('performance');
    };
  }, [autoConnect]);

  useEffect(() => {
    // Set up WebSocket event listeners
    const handleConnectionOpen = (data: any) => {
      if (data.connectionId === 'performance') {
        setIsConnected(true);
        setError(null);
        updateConnectionStatus();
      }
    };

    const handleConnectionClose = (data: any) => {
      if (data.connectionId === 'performance') {
        setIsConnected(false);
        updateConnectionStatus();
      }
    };

    const handleConnectionError = (data: any) => {
      if (data.connectionId === 'performance') {
        setError('Connection error occurred');
        setIsConnected(false);
        updateConnectionStatus();
      }
    };

    const handleMessage = (data: any) => {
      if (data.connectionId === 'performance' && data.type === 'performance') {
        const newData = data.data as PerformanceStreamData;
        setCurrentMetrics(newData);
        
        setPerformanceData(prev => {
          const updated = [...prev, newData];
          return updated.slice(-maxDataPoints);
        });
      }
    };

    webSocketService.on('connection_opened', handleConnectionOpen);
    webSocketService.on('connection_closed', handleConnectionClose);
    webSocketService.on('connection_error', handleConnectionError);
    webSocketService.on('message_received', handleMessage);

    return () => {
      webSocketService.off('connection_opened', handleConnectionOpen);
      webSocketService.off('connection_closed', handleConnectionClose);
      webSocketService.off('connection_error', handleConnectionError);
      webSocketService.off('message_received', handleMessage);
    };
  }, [maxDataPoints]);

  useEffect(() => {
    if (performanceData.length > 0) {
      renderChart();
    }
  }, [performanceData]);

  const connectToStream = async () => {
    try {
      setError(null);
      await webSocketService.connectToPerformanceStream();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to performance stream');
    }
  };

  const disconnectFromStream = () => {
    webSocketService.disconnect('performance');
  };

  const updateConnectionStatus = () => {
    const status = webSocketService.getConnectionStatus('performance');
    setConnectionStatus(status);
  };

  const renderChart = () => {
    if (!chartRef.current || performanceData.length === 0) {
      return;
    }

    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Chart dimensions
    const padding = 60;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;

    // Get response time data
    const responseTimes = performanceData.map(d => d.responseTime);
    const minTime = Math.min(...responseTimes);
    const maxTime = Math.max(...responseTimes);
    const timeRange = maxTime - minTime || 1;

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
    const timeSteps = Math.min(performanceData.length, 10);
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

    // Draw response time line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();

    responseTimes.forEach((time, index) => {
      const x = padding + (chartWidth * index) / (responseTimes.length - 1);
      const y = padding + chartHeight - ((time - minTime) / timeRange) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw data points
    ctx.fillStyle = '#3b82f6';
    responseTimes.forEach((time, index) => {
      const x = padding + (chartWidth * index) / (responseTimes.length - 1);
      const y = padding + chartHeight - ((time - minTime) / timeRange) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = '#374151';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';

    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const value = maxTime - (timeRange * i) / 5;
      const y = padding + (chartHeight * i) / 5;
      ctx.fillText(`${value.toFixed(0)}ms`, padding - 10, y + 4);
    }

    // X-axis labels (time)
    ctx.textAlign = 'center';
    const labelStep = Math.max(1, Math.floor(performanceData.length / 6));
    performanceData.forEach((point, index) => {
      if (index % labelStep === 0) {
        const x = padding + (chartWidth * index) / (responseTimes.length - 1);
        const time = new Date(point.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        });
        ctx.fillText(time, x, padding + chartHeight + 20);
      }
    });

    // Chart title
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Real-time Response Time', padding + chartWidth / 2, 30);
  };

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        const canvas = chartRef.current;
        const container = canvas.parentElement;
        if (container) {
          canvas.width = container.clientWidth;
          canvas.height = 300;
          renderChart();
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getConnectionStatusColor = (status: WebSocketConnectionStatus | null): string => {
    if (!status) {
      return 'text-gray-500';
    }
    if (status.connected) {
      return 'text-green-600';
    }
    if (status.connecting) {
      return 'text-yellow-600';
    }
    return 'text-red-600';
  };

  const getConnectionStatusText = (status: WebSocketConnectionStatus | null): string => {
    if (!status) {
      return 'Disconnected';
    }
    if (status.connected) {
      return 'Connected';
    }
    if (status.connecting) {
      return 'Connecting...';
    }
    return 'Disconnected';
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Real-time Performance Monitor
          </h3>
          <div className="flex items-center space-x-4">
            {showConnectionStatus && (
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                } ${isConnected ? 'animate-pulse' : ''}`}></div>
                <span className={`text-sm font-medium ${getConnectionStatusColor(connectionStatus)}`}>
                  {getConnectionStatusText(connectionStatus)}
                </span>
              </div>
            )}
            <button
              onClick={isConnected ? disconnectFromStream : connectToStream}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isConnected 
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        </div>

        {/* Current Metrics */}
        {currentMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">Response Time</p>
                  <p className="text-lg font-semibold text-blue-900">
                    {currentMetrics.responseTime.toFixed(0)}ms
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Cache Hit Rate</p>
                  <p className="text-lg font-semibold text-green-900">
                    {(currentMetrics.cacheHitRate * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-600">Active Requests</p>
                  <p className="text-lg font-semibold text-purple-900">
                    {currentMetrics.activeRequests}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-600">System Load</p>
                  <p className="text-lg font-semibold text-yellow-900">
                    {(currentMetrics.systemLoad * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real-time Chart */}
        <div className="mb-6">
          <div className="relative" style={{ height: '300px' }}>
            <canvas
              ref={chartRef}
              className="w-full h-full"
              style={{ height: '300px' }}
            />
          </div>
        </div>

        {/* Connection Info */}
        {connectionStatus && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Connection Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Status:</span>
                <span className={`ml-2 font-medium ${getConnectionStatusColor(connectionStatus)}`}>
                  {getConnectionStatusText(connectionStatus)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Data Points:</span>
                <span className="ml-2 font-medium text-gray-900">{performanceData.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Client ID:</span>
                <span className="ml-2 font-medium text-gray-900 font-mono text-xs">
                  {connectionStatus.clientId || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Last Connected:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {connectionStatus.lastConnected 
                    ? connectionStatus.lastConnected.toLocaleTimeString()
                    : 'Never'
                  }
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimePerformanceMonitor;
