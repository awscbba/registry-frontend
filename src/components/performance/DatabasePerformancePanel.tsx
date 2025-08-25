import React, { useState, useEffect } from 'react';
import { getComponentLogger } from '../../utils/logger';
import type { DatabaseMetrics, DatabasePerformancePanelProps } from '../../types/database';
import databaseService, { DatabaseService } from '../../services/databaseService';

const DatabasePerformancePanel: React.FC<DatabasePerformancePanelProps> = ({
  refreshInterval = 30000,
  showDetailedMetrics = true,
  compactView = false
}) => {
  const [metrics, setMetrics] = useState<DatabaseMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch database metrics
  const fetchDatabaseMetrics = async () => {
    try {
      setError(null);
      const data = await databaseService.getMetrics();
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch database metrics');
      logger.error('Database metrics error', { error: err.message }, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseMetrics();
    
    const interval = setInterval(fetchDatabaseMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const handleRefresh = () => {
    setLoading(true);
    fetchDatabaseMetrics();
  };

  if (loading && !metrics) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-red-600">
          <p>Error loading database metrics: {error}</p>
          <button 
            onClick={fetchDatabaseMetrics}
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
            Database Performance
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

        {metrics && (
          <>
            {/* Database Overview Cards */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 ${compactView ? 'gap-3' : ''}`}>
              {/* Average Query Time */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Avg Query Time</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {DatabaseService.formatQueryTime(metrics.queryAnalysis.averageQueryTime)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Connection Pool Utilization */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Pool Utilization</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {DatabaseService.formatUtilization(metrics.connectionPoolStatus.utilizationRate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Queries */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Total Queries</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {metrics.queryAnalysis.totalQueries.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Score */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                      metrics.queryAnalysis.performanceScore >= 90 ? 'bg-green-100' :
                      metrics.queryAnalysis.performanceScore >= 70 ? 'bg-blue-100' :
                      metrics.queryAnalysis.performanceScore >= 50 ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                      <svg className={`w-5 h-5 ${
                        metrics.queryAnalysis.performanceScore >= 90 ? 'text-green-600' :
                        metrics.queryAnalysis.performanceScore >= 70 ? 'text-blue-600' :
                        metrics.queryAnalysis.performanceScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Performance Score</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {metrics.queryAnalysis.performanceScore}/100
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Pool Status */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Connection Pool Status</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {metrics.connectionPoolStatus.activeConnections}
                    </div>
                    <div className="text-sm text-gray-600">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {metrics.connectionPoolStatus.idleConnections}
                    </div>
                    <div className="text-sm text-gray-600">Idle</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {metrics.connectionPoolStatus.totalConnections}
                    </div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {DatabaseService.formatUtilization(metrics.connectionPoolStatus.efficiency)}
                    </div>
                    <div className="text-sm text-gray-600">Efficiency</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Query Performance */}
            {showDetailedMetrics && metrics.queryPerformance.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Query Performance</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Query Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Count
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Optimization
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {metrics.queryPerformance.map((query, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {query.queryType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {DatabaseService.formatQueryTime(query.averageExecutionTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {query.executionCount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span 
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full`}
                              style={{ 
                                backgroundColor: DatabaseService.getOptimizationLevelColor(query.optimizationLevel) + '20',
                                color: DatabaseService.getOptimizationLevelColor(query.optimizationLevel)
                              }}
                            >
                              {query.optimizationLevel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Optimization Opportunities */}
            {metrics.queryAnalysis.optimizationOpportunities > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Optimization Opportunities Available
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                      {metrics.queryAnalysis.optimizationOpportunities} queries can be optimized for better performance.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
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

export default DatabasePerformancePanel;
