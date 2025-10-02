// Performance Service - Integration with backend Performance Optimization APIs
// Connects to 7 performance endpoints from Phase 1

import type {
  PerformanceMetrics,
  CacheStats,
  PerformanceHistory,
  PerformanceAnalytics,
  EndpointMetric,
  HealthStatus
} from '../types/performance';
import { getServiceLogger } from '../utils/logger';
import { httpClient, getApiUrl } from './httpClient';

const logger = getServiceLogger('PerformanceService');

class PerformanceService {
  constructor() {
    // No need to store baseUrl, using httpClient with getApiUrl
  }

  /**
   * Get current performance metrics
   * Endpoint: GET /admin/performance/dashboard
   */
  async getMetrics(): Promise<PerformanceMetrics> {
    try {
      const response = await httpClient.getJson(getApiUrl('/v2/admin/performance/dashboard')) as any;
      const data = response.success ? response.data : response;
      return {
        responseTime: data?.overview?.average_response_time || 0,
        cacheHitRate: data?.cache?.hit_rate || 0,
        slowestEndpoints: data?.slowest_endpoints || [],
        systemHealth: data?.system_health || { status: 'healthy', score: 100, issues: [], uptime: 0 },
        activeRequests: data?.overview?.active_requests || 0,
        timestamp: data?.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error fetching performance metrics', { error: error.message }, error);
      throw error;
    }
  }

  /**
   * Get cache statistics and performance
   * Endpoint: GET /admin/performance/cache/stats
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      const response = await httpClient.getJson(getApiUrl('/v2/admin/performance/cache/stats')) as any;
      const data = response.success ? response.data : response;
      return {
        hitRate: data?.hit_rate || 0,
        missRate: data?.miss_rate || 0,
        totalRequests: data?.total_requests || 0,
        cacheSize: data?.cache_size || 0,
        ttlStats: {
          averageTTL: data?.ttl_stats?.average_ttl || 0,
          expiredKeys: data?.ttl_stats?.expired_keys || 0,
          activeKeys: data?.ttl_stats?.active_keys || 0,
          memoryUsage: data?.ttl_stats?.memory_usage || 0,
        },
        performance: {
          averageHitTime: data?.performance?.average_hit_time || 0,
          averageMissTime: data?.performance?.average_miss_time || 0,
          performanceImpact: data?.performance?.performance_impact || 0,
          efficiency: data?.performance?.efficiency || 0,
        },
      };
    } catch (error) {
      logger.error('Error fetching cache stats', { error: error.message }, error);
      throw error;
    }
  }

  /**
   * Get slowest endpoints analysis
   * Endpoint: GET /admin/performance/slowest-endpoints
   */
  async getSlowestEndpoints(): Promise<EndpointMetric[]> {
    try {
      const response = await httpClient.getJson(getApiUrl('/v2/admin/performance/slowest-endpoints')) as any;
      const data = response.success ? response.data : response;
      return data?.endpoints || [];
    } catch (error) {
      logger.error('Error fetching slowest endpoints', { error: error.message }, error);
      throw error;
    }
  }

  /**
   * Get system health status
   * Endpoint: GET /admin/performance/health
   */
  async getHealthStatus(): Promise<HealthStatus> {
    try {
      const response = await httpClient.getJson(getApiUrl('/v2/admin/performance/health')) as any;
      console.log('Raw health response:', response); // Debug log
      
      // Handle different response structures
      let data = response;
      if (response.success && response.data) {
        data = response.data;
      } else if (response.data && !response.success) {
        data = response.data;
      }
      
      // Extract health data from various possible structures
      const healthData = data.health || data.system_health || data;
      
      return {
        status: healthData?.status || data?.status || 'healthy',
        score: healthData?.overallScore || data?.overallScore || healthData?.score || data?.score || 100,
        issues: healthData?.issues || data?.issues || [],
        uptime: healthData?.uptime || data?.uptime || 0,
      };
    } catch (error) {
      console.error('Health check error:', error); // Debug log
      throw new Error(`Health check failed: ${error.message || 'API unreachable'}`);
    }
  }

  /**
   * Get performance analytics and insights
   * Endpoint: GET /admin/performance/analytics
   */
  async getAnalytics(): Promise<PerformanceAnalytics> {
    try {
      const response = await httpClient.getJson(getApiUrl('/v2/admin/performance/analytics')) as any;
      const data = response.success ? response.data : response;
      return {
        summary: data?.summary || {
          totalRequests: 0,
          averageResponseTime: 0,
          overallCacheHitRate: 0,
          systemHealthScore: 100,
          performanceGrade: 'A',
        },
        trends: data?.trends || [],
        recommendations: data?.recommendations || [],
        alerts: data?.alerts || [],
      };
    } catch (error) {
      logger.error('Error fetching performance analytics', { error: error.message }, error);
      throw error;
    }
  }

  /**
   * Get performance history for charts
   * Custom endpoint for historical data
   */
  async getPerformanceHistory(timeRange: string = '24h'): Promise<PerformanceHistory> {
    try {
      const response = await httpClient.getJson(getApiUrl(`/admin/performance/history?range=${timeRange}`)) as any;
      const data = response.success ? response.data : response;
      return {
        timeRange: data?.time_range || timeRange,
        dataPoints: data?.data_points || [],
        trends: data?.trends || [],
      };
    } catch (error) {
      logger.error('Error fetching performance history', { error: error.message }, error);
      throw error;
    }
  }

  /**
   * Clear cache (specific type or all)
   * Endpoint: POST /admin/performance/cache/clear
   */
  async clearCache(cacheType?: string): Promise<{ success: boolean; message: string }> {
    try {
      const body = cacheType ? { cache_type: cacheType } : {};
      const response = await httpClient.postJson(getApiUrl('/v2/admin/performance/cache/clear'), body) as any;
      return {
        success: response.success || false,
        message: response.message || response.data?.message || 'Cache cleared successfully',
      };
    } catch (error) {
      logger.error('Error clearing cache', { error: error.message }, error);
      throw error;
    }
  }

  /**
   * Get cache health status
   * Endpoint: GET /admin/performance/cache/health
   */
  async getCacheHealth(): Promise<{ status: string; details: Record<string, unknown> }> {
    try {
      const response = await httpClient.getJson(getApiUrl('/v2/admin/performance/cache/health')) as any;
      const data = response.success ? response.data : response;
      return {
        status: data?.status || 'healthy',
        details: data?.details || {},
      };
    } catch (error) {
      logger.error('Error fetching cache health', { error: error.message }, error);
      throw error;
    }
  }



  /**
   * Format response time for display
   */
  static formatResponseTime(ms: number): string {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  }

  /**
   * Format cache hit rate as percentage
   */
  static formatCacheHitRate(rate: number): string {
    return `${(rate * 100).toFixed(1)}%`;
  }

  /**
   * Get performance status color based on metrics
   */
  static getPerformanceStatusColor(responseTime: number, cacheHitRate: number): string {
    if (responseTime < 100 && cacheHitRate > 0.8) {
      return '#10b981'; // Excellent - Green
    }
    if (responseTime < 300 && cacheHitRate > 0.6) {
      return '#3b82f6'; // Good - Blue
    }
    if (responseTime < 500 && cacheHitRate > 0.4) {
      return '#f59e0b'; // Warning - Yellow
    }
    return '#ef4444'; // Critical - Red
  }

  /**
   * Get health status badge info
   */
  static getHealthStatusBadge(status: string): { color: string; text: string } {
    switch (status) {
      case 'healthy':
        return { color: '#10b981', text: 'Healthy' };
      case 'warning':
        return { color: '#f59e0b', text: 'Warning' };
      case 'critical':
        return { color: '#ef4444', text: 'Critical' };
      case 'error':
        return { color: '#dc2626', text: 'Error' };
      default:
        return { color: '#6b7280', text: 'Unknown' };
    }
  }
}

export { PerformanceService };
export default new PerformanceService();
