// WebSocket Service for Real-time Performance Monitoring
// Integrates with backend Performance Optimization Phase 3 Week 1

import { API_CONFIG } from '../config/api';
import type {
  WebSocketMessage,
  WebSocketConnectionStatus,
  WebSocketSubscription,
  WebSocketConfig,
  WebSocketEvent,
  WebSocketEventType,
  PerformanceStreamData,
  AlertStreamData,
  DatabaseStreamData
} from '../types/websocket';

class WebSocketService {
  private static instance: WebSocketService;
  private connections: Map<string, WebSocket> = new Map();
  private subscriptions: Map<string, WebSocketSubscription> = new Map();
  private eventListeners: Map<WebSocketEventType, Set<(data: any) => void>> = new Map();
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map();
  
  private config: WebSocketConfig = {
    baseUrl: this.getWebSocketBaseUrl(),
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
    subscriptions: []
  };

  private connectionStatus: Map<string, WebSocketConnectionStatus> = new Map();

  constructor() {
    // Initialize event listener maps
    const eventTypes: WebSocketEventType[] = [
      'connection_opened', 'connection_closed', 'connection_error',
      'message_received', 'subscription_added', 'subscription_removed',
      'heartbeat_sent', 'heartbeat_received'
    ];
    
    eventTypes.forEach(type => {
      this.eventListeners.set(type, new Set());
    });
  }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private getWebSocketBaseUrl(): string {
    // Convert HTTP URL to WebSocket URL
    const baseUrl = API_CONFIG.BASE_URL;
    return baseUrl.replace('https://', 'wss://').replace('http://', 'ws://');
  }

  private getAuthToken(): string {
    return localStorage.getItem('userAuthToken') || '';
  }

  /**
   * Connect to performance live stream WebSocket
   */
  async connectToPerformanceStream(): Promise<void> {
    const url = `${this.config.baseUrl}/admin/performance/live-stream`;
    await this.connect('performance', url);
  }

  /**
   * Connect to alerts stream WebSocket
   */
  async connectToAlertsStream(): Promise<void> {
    const url = `${this.config.baseUrl}/admin/performance/alerts-stream`;
    await this.connect('alerts', url);
  }

  /**
   * Connect to database performance stream (if available)
   */
  async connectToDatabaseStream(): Promise<void> {
    const url = `${this.config.baseUrl}/admin/database/performance/live-stream`;
    await this.connect('database', url);
  }

  /**
   * Generic connection method
   */
  private async connect(connectionId: string, url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Close existing connection if any
        this.disconnect(connectionId);

        // Create WebSocket connection with auth token
        const token = this.getAuthToken();
        const wsUrl = token ? `${url}?token=${encodeURIComponent(token)}` : url;
        
        const ws = new WebSocket(wsUrl);
        
        // Set connection status
        this.setConnectionStatus(connectionId, {
          connected: false,
          connecting: true,
          error: null,
          lastConnected: null,
          reconnectAttempts: 0,
          clientId: null
        });

        ws.onopen = (event) => {
          console.log(`WebSocket connected: ${connectionId}`);
          this.connections.set(connectionId, ws);
          
          this.setConnectionStatus(connectionId, {
            connected: true,
            connecting: false,
            error: null,
            lastConnected: new Date(),
            reconnectAttempts: 0,
            clientId: this.generateClientId()
          });

          this.startHeartbeat(connectionId);
          this.emit('connection_opened', { connectionId, url });
          resolve();
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(connectionId, message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        ws.onclose = (event) => {
          console.log(`WebSocket closed: ${connectionId}`, event.code, event.reason);
          this.handleConnectionClose(connectionId, event);
        };

        ws.onerror = (error) => {
          console.error(`WebSocket error: ${connectionId}`, error);
          this.handleConnectionError(connectionId, error);
          reject(error);
        };

      } catch (error) {
        console.error(`Failed to create WebSocket connection: ${connectionId}`, error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from specific WebSocket
   */
  disconnect(connectionId: string): void {
    const ws = this.connections.get(connectionId);
    if (ws) {
      ws.close();
      this.connections.delete(connectionId);
    }

    // Clear timers
    const reconnectTimer = this.reconnectTimers.get(connectionId);
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      this.reconnectTimers.delete(connectionId);
    }

    const heartbeatTimer = this.heartbeatTimers.get(connectionId);
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      this.heartbeatTimers.delete(connectionId);
    }

    // Update connection status
    this.setConnectionStatus(connectionId, {
      connected: false,
      connecting: false,
      error: null,
      lastConnected: this.connectionStatus.get(connectionId)?.lastConnected || null,
      reconnectAttempts: 0,
      clientId: null
    });

    this.emit('connection_closed', { connectionId });
  }

  /**
   * Disconnect all WebSocket connections
   */
  disconnectAll(): void {
    const connectionIds = Array.from(this.connections.keys());
    connectionIds.forEach(id => this.disconnect(id));
  }

  /**
   * Send message to specific WebSocket connection
   */
  send(connectionId: string, message: WebSocketMessage): void {
    const ws = this.connections.get(connectionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn(`Cannot send message: WebSocket ${connectionId} not connected`);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(connectionId: string): WebSocketConnectionStatus | null {
    return this.connectionStatus.get(connectionId) || null;
  }

  /**
   * Get all connection statuses
   */
  getAllConnectionStatuses(): Map<string, WebSocketConnectionStatus> {
    return new Map(this.connectionStatus);
  }

  /**
   * Subscribe to events
   */
  on(event: WebSocketEventType, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.add(callback);
    }
  }

  /**
   * Unsubscribe from events
   */
  off(event: WebSocketEventType, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(connectionId: string, message: WebSocketMessage): void {
    console.log(`WebSocket message received from ${connectionId}:`, message);

    // Update client ID if provided
    if (message.clientId) {
      const status = this.connectionStatus.get(connectionId);
      if (status) {
        this.setConnectionStatus(connectionId, { ...status, clientId: message.clientId });
      }
    }

    // Handle different message types
    switch (message.type) {
      case 'performance_data':
        this.emit('message_received', {
          connectionId,
          type: 'performance',
          data: message.data as PerformanceStreamData
        });
        break;

      case 'alert_data':
        this.emit('message_received', {
          connectionId,
          type: 'alert',
          data: message.data as AlertStreamData
        });
        break;

      case 'database_data':
        this.emit('message_received', {
          connectionId,
          type: 'database',
          data: message.data as DatabaseStreamData
        });
        break;

      case 'heartbeat':
        this.emit('heartbeat_received', { connectionId, timestamp: message.timestamp });
        break;

      case 'error':
        console.error(`WebSocket error from ${connectionId}:`, message.data);
        break;

      default:
        console.log(`Unknown message type from ${connectionId}:`, message.type);
    }
  }

  /**
   * Handle connection close
   */
  private handleConnectionClose(connectionId: string, event: CloseEvent): void {
    this.connections.delete(connectionId);
    
    const status = this.connectionStatus.get(connectionId);
    if (status) {
      this.setConnectionStatus(connectionId, {
        ...status,
        connected: false,
        connecting: false,
        error: event.reason || 'Connection closed'
      });
    }

    // Clear heartbeat timer
    const heartbeatTimer = this.heartbeatTimers.get(connectionId);
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      this.heartbeatTimers.delete(connectionId);
    }

    // Attempt reconnection if not a clean close
    if (event.code !== 1000 && status && status.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect(connectionId);
    }

    this.emit('connection_closed', { connectionId, code: event.code, reason: event.reason });
  }

  /**
   * Handle connection error
   */
  private handleConnectionError(connectionId: string, error: Event): void {
    const status = this.connectionStatus.get(connectionId);
    if (status) {
      this.setConnectionStatus(connectionId, {
        ...status,
        connected: false,
        connecting: false,
        error: 'Connection error'
      });
    }

    this.emit('connection_error', { connectionId, error });
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(connectionId: string): void {
    const status = this.connectionStatus.get(connectionId);
    if (!status || status.reconnectAttempts >= this.config.maxReconnectAttempts) {
      return;
    }

    const delay = this.config.reconnectInterval * Math.pow(2, status.reconnectAttempts);
    console.log(`Scheduling reconnect for ${connectionId} in ${delay}ms (attempt ${status.reconnectAttempts + 1})`);

    const timer = setTimeout(async () => {
      try {
        this.setConnectionStatus(connectionId, {
          ...status,
          reconnectAttempts: status.reconnectAttempts + 1
        });

        // Determine the URL based on connection ID
        let url = '';
        switch (connectionId) {
          case 'performance':
            url = `${this.config.baseUrl}/admin/performance/live-stream`;
            break;
          case 'alerts':
            url = `${this.config.baseUrl}/admin/performance/alerts-stream`;
            break;
          case 'database':
            url = `${this.config.baseUrl}/admin/database/performance/live-stream`;
            break;
          default:
            console.error(`Unknown connection ID for reconnect: ${connectionId}`);
            return;
        }

        await this.connect(connectionId, url);
      } catch (error) {
        console.error(`Reconnection failed for ${connectionId}:`, error);
        this.scheduleReconnect(connectionId);
      }
    }, delay);

    this.reconnectTimers.set(connectionId, timer);
  }

  /**
   * Start heartbeat for connection
   */
  private startHeartbeat(connectionId: string): void {
    const timer = setInterval(() => {
      const ws = this.connections.get(connectionId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        const heartbeat: WebSocketMessage = {
          type: 'heartbeat',
          data: { timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString()
        };
        ws.send(JSON.stringify(heartbeat));
        this.emit('heartbeat_sent', { connectionId });
      }
    }, this.config.heartbeatInterval);

    this.heartbeatTimers.set(connectionId, timer);
  }

  /**
   * Set connection status
   */
  private setConnectionStatus(connectionId: string, status: WebSocketConnectionStatus): void {
    this.connectionStatus.set(connectionId, status);
  }

  /**
   * Emit event to listeners
   */
  private emit(event: WebSocketEventType, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if any connection is active
   */
  isConnected(): boolean {
    return Array.from(this.connectionStatus.values()).some(status => status.connected);
  }

  /**
   * Get configuration
   */
  getConfig(): WebSocketConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<WebSocketConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

export default WebSocketService.getInstance();
