// WebSocket types for real-time performance monitoring
// Integrates with backend Performance Optimization Phase 3 Week 1

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
  clientId?: string;
}

export interface PerformanceStreamData {
  responseTime: number;
  cacheHitRate: number;
  activeRequests: number;
  systemLoad: number;
  timestamp: string;
  endpoint?: string;
}

export interface AlertStreamData {
  id: string;
  type: 'response_time' | 'cache_hit_rate' | 'system_health' | 'error_rate' | 'database_performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  threshold: number;
  currentValue: number;
  metadata?: Record<string, any>;
}

export interface DatabaseStreamData {
  queryExecutionTime: number;
  connectionPoolUtilization: number;
  activeConnections: number;
  queryThroughput: number;
  timestamp: string;
  slowQueries?: SlowQuery[];
}

export interface SlowQuery {
  query: string;
  executionTime: number;
  timestamp: string;
  database: string;
}

export interface WebSocketConnectionStatus {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastConnected: Date | null;
  reconnectAttempts: number;
  clientId: string | null;
}

export interface WebSocketSubscription {
  id: string;
  type: 'performance' | 'alerts' | 'database';
  filters?: Record<string, any>;
  active: boolean;
  lastMessage: Date | null;
}

// WebSocket service configuration
export interface WebSocketConfig {
  baseUrl: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  subscriptions: WebSocketSubscription[];
}

// Component props for real-time components
export interface RealTimePerformanceProps {
  autoConnect?: boolean;
  showConnectionStatus?: boolean;
  updateInterval?: number;
  maxDataPoints?: number;
}

export interface RealTimeAlertsProps {
  autoConnect?: boolean;
  showDismissed?: boolean;
  maxAlerts?: number;
  severityFilter?: ('low' | 'medium' | 'high' | 'critical')[];
}

export interface RealTimeDatabaseProps {
  autoConnect?: boolean;
  showSlowQueries?: boolean;
  queryThreshold?: number;
  maxDataPoints?: number;
}

// WebSocket event types
export type WebSocketEventType = 
  | 'connection_opened'
  | 'connection_closed' 
  | 'connection_error'
  | 'message_received'
  | 'subscription_added'
  | 'subscription_removed'
  | 'heartbeat_sent'
  | 'heartbeat_received';

export interface WebSocketEvent {
  type: WebSocketEventType;
  timestamp: Date;
  data?: any;
  error?: Error;
}

// Real-time chart data
export interface RealTimeChartData {
  labels: string[];
  datasets: RealTimeDataset[];
  maxDataPoints: number;
}

export interface RealTimeDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  fill: boolean;
}

// Connection manager interface
export interface ConnectionManager {
  connect(url: string): Promise<void>;
  disconnect(): void;
  subscribe(subscription: WebSocketSubscription): void;
  unsubscribe(subscriptionId: string): void;
  send(message: WebSocketMessage): void;
  getStatus(): WebSocketConnectionStatus;
  getSubscriptions(): WebSocketSubscription[];
  on(event: WebSocketEventType, callback: (data: any) => void): void;
  off(event: WebSocketEventType, callback: (data: any) => void): void;
}
