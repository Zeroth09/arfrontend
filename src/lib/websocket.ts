import { io, Socket } from 'socket.io-client'

export class MultiplayerWebSocket {
  private socket: Socket | null = null
  private eventSource: EventSource | null = null
  private serverUrl: string
  private playerId: string
  private onMessageCallback: (message: Record<string, unknown>) => void
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 2000
  private isConnected = false
  private useSSE = false

  constructor(serverUrl: string, playerId: string, onMessage: (message: Record<string, unknown>) => void) {
    this.serverUrl = serverUrl
    this.playerId = playerId
    this.onMessageCallback = onMessage
  }

  // Health check method
  async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Server health check passed:', data)
        return true
      } else {
        console.error('❌ Server health check failed:', response.status)
        return false
      }
    } catch (error) {
      console.error('❌ Server health check error:', error)
      return false
    }
  }

  async connect(): Promise<void> {
    console.log('🔌 Checking server health before connecting...')
    
    // Check server health first
    const isHealthy = await this.checkServerHealth()
    if (!isHealthy) {
      console.error('❌ Server is not healthy, will retry connection later')
      // Retry after 5 seconds
      setTimeout(() => {
        this.connect()
      }, 5000)
      return
    }
    
    console.log('🔌 Attempting WebSocket connection...')
    this.connectWebSocket()
  }

  private connectWebSocket(): void {
    try {
      console.log('Connecting to Socket.io server:', this.serverUrl)
      this.socket = io(this.serverUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 15000, // Increased timeout
        forceNew: true,
        upgrade: true,
        rememberUpgrade: false
      })

      this.socket.on('connect', () => {
        console.log('✅ Socket.io connected to multiplayer server:', this.serverUrl)
        console.log('🔗 Socket ID:', this.socket?.id)
        this.isConnected = true
        this.reconnectAttempts = 0
        this.socket?.emit('player_join', {
          playerId: this.playerId,
          timestamp: Date.now()
        })
        console.log('📤 Sent player_join event for player:', this.playerId)
        
        // Emit connection status update
        this.onMessageCallback({
          type: 'connection_status',
          status: 'connected',
          connectionType: 'WebSocket',
          timestamp: Date.now()
        })
      })

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket.io disconnected:', reason)
        this.isConnected = false
        
        // Emit connection status update
        this.onMessageCallback({
          type: 'connection_status',
          status: 'disconnected',
          reason: reason,
          timestamp: Date.now()
        })
        
        if (reason === 'io server disconnect') {
          console.log('🔄 Server disconnected, attempting to reconnect...')
          this.socket?.connect()
        }
      })

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket.io connection error:', error)
        console.error('🔗 Server URL:', this.serverUrl)
        console.error('🆔 Player ID:', this.playerId)
        this.isConnected = false
        
        // Emit connection status update
        this.onMessageCallback({
          type: 'connection_status',
          status: 'error',
          error: error.message,
          timestamp: Date.now()
        })
        
        // Try SSE as fallback
        if (!this.useSSE) {
          console.log('🔄 WebSocket failed, trying Server-Sent Events...')
          this.useSSE = true
          this.connectSSE()
        }
      })

      this.socket.on('player_join', (data: Record<string, unknown>) => {
        console.log('📥 Received player_join via WebSocket:', data)
        this.onMessageCallback(data)
      })

      this.socket.on('player_leave', (data: Record<string, unknown>) => {
        console.log('📥 Received player_leave via WebSocket:', data)
        this.onMessageCallback(data)
      })

      this.socket.on('current_players', (data: Record<string, unknown>) => {
        console.log('📥 Received current_players via WebSocket:', data)
        this.onMessageCallback(data)
      })

      this.socket.on('serverStatus', (data: Record<string, unknown>) => {
        console.log('📥 Received serverStatus via WebSocket:', data)
        this.onMessageCallback(data)
      })

    } catch (error) {
      console.error('Failed to connect Socket.io:', error)
      // Try SSE as fallback
      if (!this.useSSE) {
        console.log('🔄 WebSocket failed, trying Server-Sent Events...')
        this.useSSE = true
        this.connectSSE()
      }
    }
  }

  private connectSSE(): void {
    try {
      console.log('📡 Connecting to Server-Sent Events:', `${this.serverUrl}/api/events`)
      
      this.eventSource = new EventSource(`${this.serverUrl}/api/events`)
      
      this.eventSource.onopen = () => {
        console.log('✅ SSE connection established')
        this.isConnected = true
        this.reconnectAttempts = 0
      }

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as Record<string, unknown>
          console.log('📥 Received SSE event:', data)
          this.onMessageCallback(data)
        } catch (error) {
          console.error('❌ Failed to parse SSE data:', error)
        }
      }

      this.eventSource.onerror = (error) => {
        console.error('❌ SSE connection error:', error)
        this.isConnected = false
        this.reconnectAttempts++
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log(`🔄 SSE reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
          setTimeout(() => {
            this.connectSSE()
          }, this.reconnectDelay)
        } else {
          console.error('❌ SSE connection failed after max attempts')
        }
      }

    } catch (error) {
      console.error('Failed to connect SSE:', error)
    }
  }

  emit(event: string, data: Record<string, unknown>): void {
    if (this.useSSE) {
      // Use HTTP API for SSE
      this.emitViaHTTP(event, data)
    } else if (this.socket && this.socket.connected) {
      console.log(`📤 Emitting ${event}:`, data)
      this.socket.emit(event, data)
    } else {
      console.warn('⚠️ Socket not connected, event not sent:', event, data)
      if (this.socket) {
        console.log('🔄 Attempting to reconnect and retry emit...')
        this.socket.connect()
        setTimeout(() => {
          if (this.socket && this.socket.connected) {
            console.log(`📤 Retrying emit ${event}:`, data)
            this.socket.emit(event, data)
          } else {
            console.error(`❌ Failed to emit ${event} after reconnect attempt`)
            // Try HTTP API as last resort
            this.emitViaHTTP(event, data)
          }
        }, 2000)
      } else {
        // Try HTTP API as last resort
        this.emitViaHTTP(event, data)
      }
    }
  }

  private lastHttpRequest = 0;
  private httpRequestCooldown = 2000; // 2 seconds between HTTP requests
  private consecutiveFailures = 0;
  private maxConsecutiveFailures = 3;
  private circuitBreakerOpen = false;

  private async emitViaHTTP(event: string, data: Record<string, unknown>): Promise<void> {
    try {
      // Check circuit breaker
      if (this.circuitBreakerOpen) {
        console.log('🔌 Circuit breaker open, skipping HTTP request');
        return;
      }
      
      // Throttle HTTP requests to prevent rate limiting
      const now = Date.now();
      if (now - this.lastHttpRequest < this.httpRequestCooldown) {
        console.log('⏳ HTTP request throttled, skipping...');
        return;
      }
      this.lastHttpRequest = now;
      
      console.log(`📤 Emitting ${event} via HTTP API:`, data)
      
      // Add timeout and retry logic
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      if (event === 'player_join') {
        const response = await fetch(`${this.serverUrl}/api/player/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const result = await response.json()
          console.log('✅ HTTP API response:', result)
          // Reset failure counter on success
          this.consecutiveFailures = 0;
        } else if (response.status === 429) {
          console.error('❌ Rate limited - too many requests')
          this.consecutiveFailures++;
          // Increase cooldown on rate limit
          this.httpRequestCooldown = 10000; // 10 seconds
          
          // Open circuit breaker if too many failures
          if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
            this.circuitBreakerOpen = true;
            console.log('🔌 Circuit breaker opened due to repeated failures');
            // Reset after 30 seconds
            setTimeout(() => {
              this.circuitBreakerOpen = false;
              this.consecutiveFailures = 0;
              console.log('🔌 Circuit breaker reset');
            }, 30000);
          }
        } else {
          console.error('❌ HTTP API error:', response.status, response.statusText)
          this.consecutiveFailures++;
          
          // Open circuit breaker if too many failures
          if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
            this.circuitBreakerOpen = true;
            console.log('🔌 Circuit breaker opened due to repeated failures');
            setTimeout(() => {
              this.circuitBreakerOpen = false;
              this.consecutiveFailures = 0;
              console.log('🔌 Circuit breaker reset');
            }, 30000);
          }
          
          // Try to get error details
          try {
            const errorText = await response.text()
            console.error('❌ HTTP API error details:', errorText)
          } catch (e) {
            console.error('❌ Could not read error response')
          }
        }
      } else if (event === 'player_leave') {
        const response = await fetch(`${this.serverUrl}/api/player/leave`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const result = await response.json()
          console.log('✅ HTTP API response:', result)
        } else if (response.status === 429) {
          console.error('❌ Rate limited - too many requests')
          this.httpRequestCooldown = 10000; // 10 seconds
        } else {
          console.error('❌ HTTP API error:', response.status, response.statusText)
        }
      }
    } catch (error) {
      console.error('❌ HTTP API emit failed:', error)
      
      // Check if it's a timeout or network error
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('❌ HTTP API timeout - server might be overloaded')
        } else if (error.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
          console.error('❌ Server resources exhausted - trying again later')
          // Retry after a longer delay
          setTimeout(() => {
            this.emitViaHTTP(event, data)
          }, 5000)
        }
      }
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
    
    this.isConnected = false
    console.log('🔌 Disconnected from multiplayer server')
  }

  isConnectedToServer(): boolean {
    return this.isConnected
  }

  getConnectionType(): string {
    if (this.useSSE) {
      return 'SSE'
    } else if (this.socket && this.socket.connected) {
      return 'WebSocket'
    } else {
      return 'Disconnected'
    }
  }
} 