import React, { useState, useEffect } from 'react';
import type { 
  PerformanceMetrics, 
  PerformanceAnalytics,
  PerformanceDashboardProps 
} from '../../types/performance';
import performanceService, { PerformanceService } from '../../services/performanceService';
import CacheManagementPanel from './CacheManagementPanel';
import PerformanceCharts from './PerformanceCharts';
import SystemHealthOverview from './SystemHealthOverview';

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  refreshInterval = 30000, // 30 seconds default
  showAdvancedMetrics = true,
  compactView = false
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch performance data
  const fetchPerformanceData = async () => {
    try {
      setError(null);
      const [metricsData, analyticsData] = await Promise.all([
        performanceService.getMetrics(),
        performanceService.getAnalytics()
      ]);
      
      setMetrics(metricsData);
      setAnalytics(analyticsData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch performance data');
      console.error('Performance dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and refresh interval
  useEffect(() => {
    fetchPerformanceData();
    
    const interval = setInterval(fetchPerformanceData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Manual refresh handler
  const handleRefresh = () => {
    setLoading(true);
    fetchPerformanceData();
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Performance Data Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button 
              onClick={handleRefresh}
              className="mt-2 text-sm text-red-800 underline hover:text-red-900"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${compactView ? 'space-y-4' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Real-time system performance monitoring and analytics
          </p>
        </div>
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

      {/* Key Metrics Cards */}
      {metrics && (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${compactView ? 'gap-4' : ''}`}>
          {/* Response Time */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avg Response Time
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {PerformanceService.formatResponseTime(metrics.responseTime)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className={`font-medium ${
                  metrics.responseTime < 100 ? 'text-green-600' :
                  metrics.responseTime < 300 ? 'text-blue-600' :
                  metrics.responseTime < 500 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {metrics.responseTime < 100 ? 'Excellent' :
                   metrics.responseTime < 300 ? 'Good' :
                   metrics.responseTime < 500 ? 'Fair' : 'Poor'}
                </span>
              </div>
            </div>
          </div>

          {/* Cache Hit Rate */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Cache Hit Rate
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {PerformanceService.formatCacheHitRate(metrics.cacheHitRate)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className={`font-medium ${
                  metrics.cacheHitRate > 0.8 ? 'text-green-600' :
                  metrics.cacheHitRate > 0.6 ? 'text-blue-600' :
                  metrics.cacheHitRate > 0.4 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {metrics.cacheHitRate > 0.8 ? 'Excellent' :
                   metrics.cacheHitRate > 0.6 ? 'Good' :
                   metrics.cacheHitRate > 0.4 ? 'Fair' : 'Poor'}
                </span>
              </div>
            </div>
          </div>

          {/* Active Requests */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Requests
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {metrics.activeRequests.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-gray-600">
                  Current load
                </span>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                    metrics.systemHealth.status === 'healthy' ? 'bg-green-100' :
                    metrics.systemHealth.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      metrics.systemHealth.status === 'healthy' ? 'text-green-600' :
                      metrics.systemHealth.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      System Health
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {metrics.systemHealth.score}/100
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className={`font-medium ${
                  metrics.systemHealth.status === 'healthy' ? 'text-green-600' :
                  metrics.systemHealth.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {PerformanceService.getHealthStatusBadge(metrics.systemHealth.status).text}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Analytics */}
      {analytics && showAdvancedMetrics && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Performance Analytics
            </h3>
            
            {/* Performance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.summary.performanceGrade}
                </div>
                <div className="text-sm text-gray-600">Overall Grade</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analytics.summary.totalRequests.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Requests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {analytics.summary.systemHealthScore}
                </div>
                <div className="text-sm text-gray-600">Health Score</div>
              </div>
            </div>

            {/* Recommendations */}
            {analytics.recommendations.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Performance Recommendations
                </h4>
                <div className="space-y-3">
                  {analytics.recommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="border-l-4 border-blue-400 bg-blue-50 p-4">
                      <div className="flex">
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-800">
                            {rec.title}
                          </p>
                          <p className="text-sm text-blue-700 mt-1">
                            {rec.description}
                          </p>
                          <div className="mt-2 flex items-center space-x-4 text-xs text-blue-600">
                            <span>Priority: {rec.priority}</span>
                            <span>Impact: {rec.expectedImpact}</span>
                            <span>Effort: {rec.implementationEffort}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
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
  );
};

export default PerformanceDashboard;
