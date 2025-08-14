// Database optimization types for frontend integration
// Aligns with backend Performance Optimization Phase 2

export interface DatabaseMetrics {
  queryPerformance: QueryStats[];
  connectionPoolStatus: PoolStatus;
  optimizationRecommendations: Recommendation[];
  queryAnalysis: QueryAnalysis;
  timestamp: string;
}

export interface QueryStats {
  queryType: string;
  averageExecutionTime: number;
  executionCount: number;
  slowestQuery: string;
  fastestQuery: string;
  optimizationLevel: 'excellent' | 'good' | 'fair' | 'poor';
  lastExecuted: string;
}

export interface PoolStatus {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  utilizationRate: number;
  efficiency: number;
  maxPoolSize: number;
  minPoolSize: number;
  connectionWaitTime: number;
}

export interface Recommendation {
  id: string;
  type: 'query' | 'connection' | 'index' | 'schema';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  expectedImpact: string;
  implementationEffort: 'low' | 'medium' | 'high';
  estimatedTimeToImplement: string;
  potentialPerformanceGain: number;
  applied: boolean;
  appliedAt?: string;
}

export interface QueryAnalysis {
  totalQueries: number;
  averageQueryTime: number;
  slowestQueryTime: number;
  fastestQueryTime: number;
  queryDistribution: QueryDistribution[];
  optimizationOpportunities: number;
  performanceScore: number;
}

export interface QueryDistribution {
  queryType: string;
  count: number;
  percentage: number;
  averageTime: number;
}

export interface DatabaseOptimizationHistory {
  timeRange: string;
  dataPoints: DatabaseDataPoint[];
  trends: DatabaseTrend[];
}

export interface DatabaseDataPoint {
  timestamp: string;
  queryExecutionTime: number;
  connectionPoolUtilization: number;
  activeConnections: number;
  queryThroughput: number;
}

export interface DatabaseTrend {
  metric: string;
  direction: 'improving' | 'stable' | 'degrading';
  changePercentage: number;
  timeframe: string;
}

export interface ConnectionPoolMetrics {
  poolName: string;
  currentSize: number;
  maxSize: number;
  minSize: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  averageWaitTime: number;
  connectionCreationRate: number;
  connectionDestructionRate: number;
  efficiency: number;
  healthStatus: 'healthy' | 'warning' | 'critical';
}

export interface QueryOptimizationResult {
  queryId: string;
  originalQuery: string;
  optimizedQuery?: string;
  originalExecutionTime: number;
  optimizedExecutionTime?: number;
  improvementPercentage?: number;
  optimizationTechniques: string[];
  status: 'pending' | 'optimized' | 'failed';
  appliedAt?: string;
}

// Component props interfaces
export interface DatabasePerformancePanelProps {
  refreshInterval?: number;
  showDetailedMetrics?: boolean;
  compactView?: boolean;
}

export interface QueryOptimizationPanelProps {
  showRecommendations?: boolean;
  allowOptimizationApplication?: boolean;
  maxRecommendations?: number;
}

export interface ConnectionPoolMonitorProps {
  showAllPools?: boolean;
  alertThreshold?: number;
  refreshInterval?: number;
}

export interface DatabaseChartsProps {
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  metrics: ('queryTime' | 'poolUtilization' | 'throughput' | 'connections')[];
  height?: number;
}
