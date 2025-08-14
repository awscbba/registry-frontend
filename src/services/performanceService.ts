// Performance Service - Integration with backend Performance Optimization APIs
// Connects to 7 performance endpoints from Phase 1

import { API_CONFIG } from '../config/api';
import type {
  PerformanceMetrics,
  CacheStats,
  PerformanceHistory,
  PerformanceAnalytics,
  EndpointMetric,
  HealthStatus
} from '../types/performance';

class PerformanceService {
  private baseUrl: string;

  constructor() {
    // Use existing API configuration
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  /**
   * Get current performance metrics
   * Endpoint: GET /admin/performance/metrics
   */
  async getMetrics(): Promise<PerformanceMetrics> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/performance/metrics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch performance metrics: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        responseTime: data.average_response_time || 0,
        cacheHitRate: data.cache_hit_rate || 0,
        slowestEndpoints: data.slowest_endpoints || [],
        systemHealth: data.system_health || { status: 'healthy', score: 100, issues: [], uptime: 0 },
        activeRequests: data.active_requests || 0,
        timestamp: data.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics and performance
   * Endpoint: GET /admin/performance/cache/stats
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/performance/cache/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch cache stats: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        hitRate: data.hit_rate || 0,
        missRate: data.miss_rate || 0,
        totalRequests: data.total_requests || 0,
        cacheSize: data.cache_size || 0,
        ttlStats: {
          averageTTL: data.ttl_stats?.average_ttl || 0,
          expiredKeys: data.ttl_stats?.expired_keys || 0,
          activeKeys: data.ttl_stats?.active_keys || 0,
          memoryUsage: data.ttl_stats?.memory_usage || 0,
        },
        performance: {
          averageHitTime: data.performance?.average_hit_time || 0,
          averageMissTime: data.performance?.average_miss_time || 0,
          performanceImpact: data.performance?.performance_impact || 0,
          efficiency: data.performance?.efficiency || 0,
        },
      };
    } catch (error) {
      console.error('Error fetching cache stats:', error);
      throw error;
    }
  }

  /**
   * Get slowest endpoints analysis
   * Endpoint: GET /admin/performance/slowest-endpoints
   */
  async getSlowestEndpoints(): Promise<EndpointMetric[]> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/performance/slowest-endpoints`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch slowest endpoints: ${response.statusText}`);
      }

      const data = await response.json();
      return data.endpoints || [];
    } catch (error) {
      console.error('Error fetching slowest endpoints:', error);
      throw error;
    }
  }

  /**
   * Get system health status
   * Endpoint: GET /admin/performance/health
   */
  async getHealthStatus(): Promise<HealthStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/performance/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch health status: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        status: data.status || 'healthy',
        score: data.score || 100,
        issues: data.issues || [],
        uptime: data.uptime || 0,
      };
    } catch (error) {
      console.error('Error fetching health status:', error);
      throw error;
    }
  }

  /**
   * Get performance analytics and insights
   * Endpoint: GET /admin/performance/analytics
   */
  async getAnalytics(): Promise<PerformanceAnalytics> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/performance/analytics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch performance analytics: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        summary: data.summary || {
          totalRequests: 0,
          averageResponseTime: 0,
          overallCacheHitRate: 0,
          systemHealthScore: 100,
          performanceGrade: 'A',
        },
        trends: data.trends || [],
        recommendations: data.recommendations || [],
        alerts: data.alerts || [],
      };
    } catch (error) {
      console.error('Error fetching performance analytics:', error);
      throw error;
    }
  }

  /**
   * Get performance history for charts
   * Custom endpoint for historical data
   */
  async getPerformanceHistory(timeRange: string = '24h'): Promise<PerformanceHistory> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/performance/history?range=${timeRange}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch performance history: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        timeRange: data.time_range || timeRange,
        dataPoints: data.data_points || [],
        trends: data.trends || [],
      };
    } catch (error) {
      console.error('Error fetching performance history:', error);
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
      
      const response = await fetch(`${this.baseUrl}/admin/performance/cache/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Failed to clear cache: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: data.success || false,
        message: data.message || 'Cache cleared successfully',
      };
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Get cache health status
   * Endpoint: GET /admin/performance/cache/health
   */
  async getCacheHealth(): Promise<{ status: string; details: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/performance/cache/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch cache health: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        status: data.status || 'healthy',
        details: data.details || {},
      };
    } catch (error) {
      console.error('Error fetching cache health:', error);
      throw error;
    }
  }

  /**
   * Get authorization header for API requests
   */
  private getAuthHeader(): string {
    // Get token from localStorage (consistent with existing authService)
    const token = localStorage.getItem('userAuthToken');
    return token ? `Bearer ${token}` : '';
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
      default:
        return { color: '#6b7280', text: 'Unknown' };
    }
  }
}

export { PerformanceService };
export default new PerformanceService();
