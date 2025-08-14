import React, { useState, useEffect } from 'react';
import type { CacheStats, CacheManagementProps } from '../../types/performance';
import performanceService, { PerformanceService } from '../../services/performanceService';

const CacheManagementPanel: React.FC<CacheManagementProps> = ({
  showControls = true,
  allowCacheClear = true,
  showDetailedStats = true
}) => {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clearingCache, setClearingCache] = useState(false);
  const [clearMessage, setClearMessage] = useState<string | null>(null);

  // Fetch cache statistics
  const fetchCacheStats = async () => {
    try {
      setError(null);
      const stats = await performanceService.getCacheStats();
      setCacheStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cache stats');
      console.error('Cache stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Clear cache handler
  const handleClearCache = async (cacheType?: string) => {
    if (!allowCacheClear) {
      return;
    }
    
    setClearingCache(true);
    setClearMessage(null);
    
    try {
      const result = await performanceService.clearCache(cacheType);
      setClearMessage(result.message);
      
      // Refresh stats after clearing
      setTimeout(() => {
        fetchCacheStats();
      }, 1000);
    } catch (err) {
      setClearMessage(err instanceof Error ? err.message : 'Failed to clear cache');
    } finally {
      setClearingCache(false);
    }
  };

  useEffect(() => {
    fetchCacheStats();
    
    // Refresh cache stats every 30 seconds
    const interval = setInterval(fetchCacheStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
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

  if (error && !cacheStats) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-red-600">
          <p>Error loading cache statistics: {error}</p>
          <button 
            onClick={fetchCacheStats}
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
            Cache Management
          </h3>
          {showControls && allowCacheClear && (
            <button
              onClick={() => handleClearCache()}
              disabled={clearingCache}
              className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {clearingCache ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Clearing...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear All Cache
                </>
              )}
            </button>
          )}
        </div>

        {/* Clear Message */}
        {clearMessage && (
          <div className={`mb-4 p-3 rounded-md ${
            clearMessage.includes('success') || clearMessage.includes('cleared') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {clearMessage}
          </div>
        )}

        {cacheStats && (
          <>
            {/* Cache Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {PerformanceService.formatCacheHitRate(cacheStats.hitRate)}
                </div>
                <div className="text-sm text-gray-600">Hit Rate</div>
                <div className={`text-xs mt-1 ${
                  cacheStats.hitRate > 0.8 ? 'text-green-600' :
                  cacheStats.hitRate > 0.6 ? 'text-blue-600' :
                  cacheStats.hitRate > 0.4 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {cacheStats.hitRate > 0.8 ? 'Excellent' :
                   cacheStats.hitRate > 0.6 ? 'Good' :
                   cacheStats.hitRate > 0.4 ? 'Fair' : 'Poor'}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {cacheStats.totalRequests.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Requests</div>
                <div className="text-xs text-gray-500 mt-1">
                  {cacheStats.missRate > 0 ? `${(cacheStats.missRate * 100).toFixed(1)}% misses` : 'No misses'}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {(cacheStats.cacheSize / 1024 / 1024).toFixed(1)}MB
                </div>
                <div className="text-sm text-gray-600">Cache Size</div>
                <div className="text-xs text-gray-500 mt-1">
                  {cacheStats.ttlStats.activeKeys} active keys
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {(cacheStats.performance.efficiency * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Efficiency</div>
                <div className="text-xs text-gray-500 mt-1">
                  {PerformanceService.formatResponseTime(cacheStats.performance.averageHitTime)} avg hit
                </div>
              </div>
            </div>

            {/* Cache Performance Chart */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Cache Performance</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Hit Rate</span>
                  <span className="text-sm font-medium text-gray-900">
                    {PerformanceService.formatCacheHitRate(cacheStats.hitRate)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      cacheStats.hitRate > 0.8 ? 'bg-green-500' :
                      cacheStats.hitRate > 0.6 ? 'bg-blue-500' :
                      cacheStats.hitRate > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${cacheStats.hitRate * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Detailed Statistics */}
            {showDetailedStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* TTL Statistics */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">TTL Statistics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average TTL</span>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.round(cacheStats.ttlStats.averageTTL / 60)} minutes
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Keys</span>
                      <span className="text-sm font-medium text-gray-900">
                        {cacheStats.ttlStats.activeKeys.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Expired Keys</span>
                      <span className="text-sm font-medium text-gray-900">
                        {cacheStats.ttlStats.expiredKeys.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Memory Usage</span>
                      <span className="text-sm font-medium text-gray-900">
                        {(cacheStats.ttlStats.memoryUsage / 1024 / 1024).toFixed(2)}MB
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Performance Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average Hit Time</span>
                      <span className="text-sm font-medium text-gray-900">
                        {PerformanceService.formatResponseTime(cacheStats.performance.averageHitTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average Miss Time</span>
                      <span className="text-sm font-medium text-gray-900">
                        {PerformanceService.formatResponseTime(cacheStats.performance.averageMissTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Performance Impact</span>
                      <span className="text-sm font-medium text-gray-900">
                        {(cacheStats.performance.performanceImpact * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Cache Efficiency</span>
                      <span className="text-sm font-medium text-gray-900">
                        {(cacheStats.performance.efficiency * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cache Controls */}
            {showControls && allowCacheClear && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-3">Cache Controls</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleClearCache('dashboard')}
                    disabled={clearingCache}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    Clear Dashboard Cache
                  </button>
                  <button
                    onClick={() => handleClearCache('api')}
                    disabled={clearingCache}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    Clear API Cache
                  </button>
                  <button
                    onClick={() => handleClearCache('user')}
                    disabled={clearingCache}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    Clear User Cache
                  </button>
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

export default CacheManagementPanel;
