// Database Optimization Service - Integration with backend Phase 2 APIs
// Connects to 5 database optimization endpoints

import { API_CONFIG } from '../config/api';
import type {
  DatabaseMetrics,
  DatabaseOptimizationHistory,
  ConnectionPoolMetrics,
  QueryOptimizationResult,
  Recommendation
} from '../types/database';

class DatabaseService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  /**
   * Get database performance metrics
   * Endpoint: GET /admin/database/performance/metrics
   */
  async getMetrics(): Promise<DatabaseMetrics> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/database/performance/metrics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch database metrics: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        queryPerformance: data.query_performance || [],
        connectionPoolStatus: data.connection_pool_status || {
          totalConnections: 0,
          activeConnections: 0,
          idleConnections: 0,
          utilizationRate: 0,
          efficiency: 0,
          maxPoolSize: 10,
          minPoolSize: 1,
          connectionWaitTime: 0
        },
        optimizationRecommendations: data.optimization_recommendations || [],
        queryAnalysis: data.query_analysis || {
          totalQueries: 0,
          averageQueryTime: 0,
          slowestQueryTime: 0,
          fastestQueryTime: 0,
          queryDistribution: [],
          optimizationOpportunities: 0,
          performanceScore: 100
        },
        timestamp: data.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching database metrics:', error);
      throw error;
    }
  }

  /**
   * Get optimization recommendations
   * Endpoint: GET /admin/database/performance/recommendations
   */
  async getRecommendations(): Promise<Recommendation[]> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/database/performance/recommendations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
      }

      const data = await response.json();
      return data.recommendations || [];
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }
  }

  /**
   * Get connection pool status
   * Endpoint: GET /admin/database/performance/connection-pool
   */
  async getConnectionPoolStatus(): Promise<ConnectionPoolMetrics[]> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/database/performance/connection-pool`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch connection pool status: ${response.statusText}`);
      }

      const data = await response.json();
      return data.pools || [];
    } catch (error) {
      console.error('Error fetching connection pool status:', error);
      throw error;
    }
  }

  /**
   * Get query analysis
   * Endpoint: GET /admin/database/performance/query-analysis
   */
  async getQueryAnalysis(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/database/performance/query-analysis`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch query analysis: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching query analysis:', error);
      throw error;
    }
  }

  /**
   * Get optimization history
   * Endpoint: GET /admin/database/performance/optimization-history
   */
  async getOptimizationHistory(timeRange: string = '24h'): Promise<DatabaseOptimizationHistory> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/database/performance/optimization-history?range=${timeRange}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch optimization history: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        timeRange: data.time_range || timeRange,
        dataPoints: data.data_points || [],
        trends: data.trends || [],
      };
    } catch (error) {
      console.error('Error fetching optimization history:', error);
      throw error;
    }
  }

  /**
   * Apply optimization recommendation
   * Endpoint: POST /admin/database/performance/apply-optimization
   */
  async applyRecommendation(recommendationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/database/performance/apply-optimization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
        body: JSON.stringify({ recommendation_id: recommendationId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to apply optimization: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: data.success || false,
        message: data.message || 'Optimization applied successfully',
      };
    } catch (error) {
      console.error('Error applying optimization:', error);
      throw error;
    }
  }

  /**
   * Get authorization header for API requests
   */
  private getAuthHeader(): string {
    const token = localStorage.getItem('userAuthToken');
    return token ? `Bearer ${token}` : '';
  }

  /**
   * Format query execution time for display
   */
  static formatQueryTime(ms: number): string {
    if (ms < 1) {
      return `${(ms * 1000).toFixed(2)}μs`;
    }
    if (ms < 1000) {
      return `${ms.toFixed(2)}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  }

  /**
   * Format connection pool utilization as percentage
   */
  static formatUtilization(rate: number): string {
    return `${(rate * 100).toFixed(1)}%`;
  }

  /**
   * Get optimization priority color
   */
  static getPriorityColor(priority: string): string {
    switch (priority) {
      case 'critical':
        return '#ef4444'; // Red
      case 'high':
        return '#f59e0b'; // Orange
      case 'medium':
        return '#3b82f6'; // Blue
      case 'low':
        return '#10b981'; // Green
      default:
        return '#6b7280'; // Gray
    }
  }

  /**
   * Get query optimization level color
   */
  static getOptimizationLevelColor(level: string): string {
    switch (level) {
      case 'excellent':
        return '#10b981'; // Green
      case 'good':
        return '#3b82f6'; // Blue
      case 'fair':
        return '#f59e0b'; // Yellow
      case 'poor':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  }

  /**
   * Get connection pool health status badge
   */
  static getPoolHealthBadge(status: string): { color: string; text: string } {
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

  /**
   * Calculate performance improvement percentage
   */
  static calculateImprovement(original: number, optimized: number): number {
    if (original === 0) {
      return 0;
    }
    return ((original - optimized) / original) * 100;
  }
}

export { DatabaseService };
export default new DatabaseService();
