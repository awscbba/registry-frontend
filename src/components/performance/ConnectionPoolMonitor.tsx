import React, { useState, useEffect } from 'react';
import type { ConnectionPoolMetrics, ConnectionPoolMonitorProps } from '../../types/database';
import databaseService, { DatabaseService } from '../../services/databaseService';

const ConnectionPoolMonitor: React.FC<ConnectionPoolMonitorProps> = ({
  showAllPools: _showAllPools = true,
  alertThreshold = 0.8,
  refreshInterval = 15000
}) => {
  const [pools, setPools] = useState<ConnectionPoolMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch connection pool status
  const fetchConnectionPools = async () => {
    try {
      setError(null);
      const data = await databaseService.getConnectionPoolStatus();
      setPools(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch connection pool status');
      console.error('Connection pool error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectionPools();
    
    const interval = setInterval(fetchConnectionPools, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const handleRefresh = () => {
    setLoading(true);
    fetchConnectionPools();
  };

  const getUtilizationColor = (utilization: number): string => {
    if (utilization >= alertThreshold) {
      return 'text-red-600 bg-red-100';
    }
    if (utilization >= 0.6) {
      return 'text-yellow-600 bg-yellow-100';
    }
    return 'text-green-600 bg-green-100';
  };

  const getHealthStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && pools.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && pools.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-red-600">
          <p>Error loading connection pool status: {error}</p>
          <button 
            onClick={fetchConnectionPools}
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
            Connection Pool Monitor
          </h3>
          <div className="flex items-center space-x-4">
            {lastUpdated && (
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg 
                className={`-ml-0.5 mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {pools.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">No Connection Pools</h4>
            <p className="text-sm text-gray-600">No connection pools found or configured.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pool Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pools.map((pool) => (
                <div key={pool.poolName} className="border border-gray-200 rounded-lg p-4">
                  {/* Pool Header */}
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">{pool.poolName}</h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getHealthStatusColor(pool.healthStatus)}`}>
                      {DatabaseService.getPoolHealthBadge(pool.healthStatus).text}
                    </span>
                  </div>

                  {/* Pool Utilization */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Utilization</span>
                      <span className={`text-sm font-medium px-2 py-1 rounded ${getUtilizationColor(pool.currentSize / pool.maxSize)}`}>
                        {DatabaseService.formatUtilization(pool.currentSize / pool.maxSize)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (pool.currentSize / pool.maxSize) >= alertThreshold ? 'bg-red-500' :
                          (pool.currentSize / pool.maxSize) >= 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(pool.currentSize / pool.maxSize) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Pool Stats */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-600">Active</div>
                      <div className="font-semibold text-blue-600">{pool.activeConnections}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Idle</div>
                      <div className="font-semibold text-green-600">{pool.idleConnections}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Current</div>
                      <div className="font-semibold text-gray-900">{pool.currentSize}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Max</div>
                      <div className="font-semibold text-gray-900">{pool.maxSize}</div>
                    </div>
                  </div>

                  {/* Waiting Requests Alert */}
                  {pool.waitingRequests > 0 && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-xs text-yellow-800">
                          {pool.waitingRequests} requests waiting
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Detailed Pool Table */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Detailed Pool Metrics</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pool Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Connections
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Efficiency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Wait Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Creation Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pools.map((pool) => (
                      <tr key={pool.poolName}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {pool.poolName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getHealthStatusColor(pool.healthStatus)}`}>
                            {DatabaseService.getPoolHealthBadge(pool.healthStatus).text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <span className="text-blue-600 font-medium">{pool.activeConnections}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-green-600 font-medium">{pool.idleConnections}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-900 font-medium">{pool.currentSize}</span>
                          </div>
                          <div className="text-xs text-gray-400">Active / Idle / Total</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${pool.efficiency * 100}%` }}
                              ></div>
                            </div>
                            <span className="font-medium">{DatabaseService.formatUtilization(pool.efficiency)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {DatabaseService.formatQueryTime(pool.averageWaitTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            <div className="text-green-600">+{pool.connectionCreationRate.toFixed(1)}/s</div>
                            <div className="text-red-600">-{pool.connectionDestructionRate.toFixed(1)}/s</div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pool Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">Pool Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {pools.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Pools</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {pools.reduce((sum, pool) => sum + pool.activeConnections, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Active Connections</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {pools.reduce((sum, pool) => sum + pool.idleConnections, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Idle Connections</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {DatabaseService.formatUtilization(
                      pools.reduce((sum, pool) => sum + pool.efficiency, 0) / pools.length
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Avg Efficiency</div>
                </div>
              </div>
            </div>

            {/* Alerts */}
            {pools.some(pool => pool.currentSize / pool.maxSize >= alertThreshold) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">High Pool Utilization Alert</h3>
                    <p className="text-sm text-red-700 mt-1">
                      One or more connection pools are running at {DatabaseService.formatUtilization(alertThreshold)} or higher utilization. 
                      Consider increasing pool size or optimizing connection usage.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  Warning: {error}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionPoolMonitor;
