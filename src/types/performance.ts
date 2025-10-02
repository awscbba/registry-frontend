// Performance monitoring types for frontend integration
// Aligns with backend Performance Optimization Phases 1-3

export interface PerformanceMetrics {
  responseTime: number;
  cacheHitRate: number;
  slowestEndpoints: EndpointMetric[];
  systemHealth: HealthStatus;
  activeRequests: number;
  timestamp: string;
}

export interface EndpointMetric {
  endpoint: string;
  method: string;
  averageResponseTime: number;
  requestCount: number;
  errorRate: number;
  lastAccessed: string;
}

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical' | 'error';
  score: number;
  issues: HealthIssue[];
  uptime: number;
  error?: string; // Error message when status is 'error'
}

export interface HealthIssue {
  type: 'performance' | 'cache' | 'database' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
}

export interface CacheStats {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  cacheSize: number;
  ttlStats: TTLStatistics;
  performance: CachePerformance;
}

export interface TTLStatistics {
  averageTTL: number;
  expiredKeys: number;
  activeKeys: number;
  memoryUsage: number;
}

export interface CachePerformance {
  averageHitTime: number;
  averageMissTime: number;
  performanceImpact: number;
  efficiency: number;
}

export interface PerformanceHistory {
  timeRange: string;
  dataPoints: PerformanceDataPoint[];
  trends: PerformanceTrend[];
}

export interface PerformanceDataPoint {
  timestamp: string;
  responseTime: number;
  cacheHitRate: number;
  activeRequests: number;
  systemLoad: number;
}

export interface PerformanceTrend {
  metric: string;
  direction: 'improving' | 'stable' | 'degrading';
  changePercentage: number;
  timeframe: string;
}

export interface PerformanceAnalytics {
  summary: PerformanceSummary;
  trends: PerformanceTrend[];
  recommendations: PerformanceRecommendation[];
  alerts: PerformanceAlert[];
}

export interface PerformanceSummary {
  totalRequests: number;
  averageResponseTime: number;
  overallCacheHitRate: number;
  systemHealthScore: number;
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface PerformanceRecommendation {
  type: 'cache' | 'database' | 'endpoint' | 'system';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  expectedImpact: string;
  implementationEffort: 'low' | 'medium' | 'high';
}

export interface PerformanceAlert {
  id: string;
  type: 'response_time' | 'cache_hit_rate' | 'system_health' | 'error_rate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  threshold: number;
  currentValue: number;
  acknowledged: boolean;
}

// Chart data interfaces
export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
}

export interface PerformanceChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  fill?: boolean;
}

// Component props interfaces
export interface PerformanceDashboardProps {
  refreshInterval?: number;
  showAdvancedMetrics?: boolean;
  compactView?: boolean;
}

export interface CacheManagementProps {
  showControls?: boolean;
  allowCacheClear?: boolean;
  showDetailedStats?: boolean;
}

export interface PerformanceChartsProps {
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  metrics: ('responseTime' | 'cacheHitRate' | 'activeRequests' | 'systemLoad')[];
  height?: number;
}
