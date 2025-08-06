import { io, Socket } from 'socket.io-client'

export interface GameMessage {
  type: 'player_join' | 'player_leave' | 'position_update' | 'shoot' | 'hit' | 'elimination' | 'game_state' | 'current_players'
  playerId: string
  data: Record<string, unknown>
  timestamp: number
}

export interface PlayerData {
  id: string
  nama: string
  tim: 'merah' | 'putih'
  position: { x: number; y: number }
  gps: { lat: number; lng: number }
  isAlive: boolean
  health: number
  kills: number
  deaths: number
  lastSeen: Date
}

export class MultiplayerWebSocket {
  private socket: Socket | null = null
  private eventSource: EventSource | null = null
  private serverUrl: string
  private playerId: string
  private onMessageCallback: (message: any) => void
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 2000
  private isConnected = false
  private useSSE = false

  constructor(serverUrl: string, playerId: string, onMessage: (message: any) => void) {
    this.serverUrl = serverUrl
    this.playerId = playerId
    this.onMessageCallback = onMessage
  }

  connect(): void {
    console.log('🔌 Attempting WebSocket connection first...')
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
        timeout: 10000,
        forceNew: true
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
      })

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket.io disconnected:', reason)
        this.isConnected = false
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
        
        // Try SSE as fallback
        if (!this.useSSE) {
          console.log('🔄 WebSocket failed, trying Server-Sent Events...')
          this.useSSE = true
          this.connectSSE()
        }
      })

      this.socket.on('player_join', (data) => {
        console.log('📥 Received player_join via WebSocket:', data)
        this.onMessageCallback(data)
      })

      this.socket.on('player_leave', (data) => {
        console.log('📥 Received player_leave via WebSocket:', data)
        this.onMessageCallback(data)
      })

      this.socket.on('current_players', (data) => {
        console.log('📥 Received current_players via WebSocket:', data)
        this.onMessageCallback(data)
      })

      this.socket.on('serverStatus', (data) => {
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
          const data = JSON.parse(event.data)
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

  private async emitViaHTTP(event: string, data: Record<string, unknown>): Promise<void> {
    try {
      console.log(`📤 Emitting ${event} via HTTP API:`, data)
      
      if (event === 'player_join') {
        const response = await fetch(`${this.serverUrl}/api/player/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('✅ HTTP API response:', result)
        } else {
          console.error('❌ HTTP API error:', response.status)
        }
      } else if (event === 'player_leave') {
        const response = await fetch(`${this.serverUrl}/api/player/leave`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('✅ HTTP API response:', result)
        } else {
          console.error('❌ HTTP API error:', response.status)
        }
      }
    } catch (error) {
      console.error('❌ HTTP API emit failed:', error)
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