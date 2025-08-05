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
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private messageHandlers: Map<string, (data: Record<string, unknown>) => void> = new Map()

  constructor(
    private serverUrl: string,
    private playerId: string,
    private onMessage: (message: GameMessage) => void
  ) {}

  connect(): void {
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
        this.reconnectAttempts = 0
        
        // Send player join message
        this.socket?.emit('player_join', {
          playerId: this.playerId,
          timestamp: Date.now()
        })
        console.log('📤 Sent player_join event for player:', this.playerId)
      })

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket.io disconnected:', reason)
        if (reason === 'io server disconnect') {
          // the disconnection was initiated by the server, you need to reconnect manually
          console.log('🔄 Server disconnected, attempting to reconnect...')
          this.socket?.connect()
        }
      })

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket.io connection error:', error)
        console.error('🔗 Server URL:', this.serverUrl)
        console.error('🆔 Player ID:', this.playerId)
      })

      // Handle server status
      this.socket.on('serverStatus', (data) => {
        console.log('Server status:', data)
      })

      // Handle lobby events
      this.socket.on('player_join', (data) => {
        console.log('👥 Received player_join event:', data)
        this.onMessage({
          type: 'player_join',
          playerId: data.playerId || 'unknown',
          data: data,
          timestamp: Date.now()
        })
      })

      this.socket.on('player_leave', (data) => {
        console.log('👋 Received player_leave event:', data)
        this.onMessage({
          type: 'player_leave',
          playerId: data.playerId || 'unknown',
          data: data,
          timestamp: Date.now()
        })
      })

      this.socket.on('game_state', (data) => {
        console.log('Game state update:', data)
        this.onMessage({
          type: 'game_state',
          playerId: 'server',
          data: data,
          timestamp: Date.now()
        })
      })

      this.socket.on('current_players', (data) => {
        console.log('Current players:', data)
        this.onMessage({
          type: 'current_players',
          playerId: 'server',
          data: data,
          timestamp: Date.now()
        })
      })

      // Handle game events
      this.socket.on('position_update', (data) => {
        this.onMessage({
          type: 'position_update',
          playerId: data.playerId || 'unknown',
          data: data,
          timestamp: Date.now()
        })
      })

      this.socket.on('shoot', (data) => {
        this.onMessage({
          type: 'shoot',
          playerId: data.playerId || 'unknown',
          data: data,
          timestamp: Date.now()
        })
      })

      this.socket.on('hit', (data) => {
        this.onMessage({
          type: 'hit',
          playerId: data.playerId || 'unknown',
          data: data,
          timestamp: Date.now()
        })
      })

      this.socket.on('elimination', (data) => {
        this.onMessage({
          type: 'elimination',
          playerId: data.playerId || 'unknown',
          data: data,
          timestamp: Date.now()
        })
      })

    } catch (error) {
      console.error('Failed to connect Socket.io:', error)
    }
  }

  sendMessage(message: GameMessage): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(message.type, {
        playerId: message.playerId,
        data: message.data,
        timestamp: message.timestamp
      })
    } else {
      console.warn('Socket not connected, message not sent:', message)
    }
  }

  // Send player position update
  sendPositionUpdate(position: { x: number; y: number }, gps: { lat: number; lng: number }): void {
    this.sendMessage({
      type: 'position_update',
      playerId: this.playerId,
      data: { position, gps, timestamp: Date.now() },
      timestamp: Date.now()
    })
  }

  // Send shooting event
  sendShoot(targetId: string, crosshairPosition: { x: number; y: number }): void {
    this.sendMessage({
      type: 'shoot',
      playerId: this.playerId,
      data: { targetId, crosshairPosition, timestamp: Date.now() },
      timestamp: Date.now()
    })
  }

  // Send hit confirmation
  sendHit(targetId: string, damage: number): void {
    this.sendMessage({
      type: 'hit',
      playerId: this.playerId,
      data: { targetId, damage, timestamp: Date.now() },
      timestamp: Date.now()
    })
  }

  // Send elimination event
  sendElimination(targetId: string): void {
    this.sendMessage({
      type: 'elimination',
      playerId: this.playerId,
      data: { targetId, timestamp: Date.now() },
      timestamp: Date.now()
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.emit('player_leave', {
        playerId: this.playerId,
        timestamp: Date.now()
      })
      this.socket.disconnect()
      this.socket = null
    }
  }

  // Add message handler
  on(event: string, handler: (data: Record<string, unknown>) => void): void {
    this.messageHandlers.set(event, handler)
  }

  // Remove message handler
  off(event: string): void {
    this.messageHandlers.delete(event)
  }

  // Public method to emit events directly
  emit(event: string, data: Record<string, unknown>): void {
    if (this.socket && this.socket.connected) {
      console.log(`📤 Emitting ${event}:`, data)
      this.socket.emit(event, data)
    } else {
      console.warn('⚠️ Socket not connected, event not sent:', event, data)
      // Try to reconnect and emit after a delay
      if (this.socket) {
        console.log('🔄 Attempting to reconnect and retry emit...')
        this.socket.connect()
        setTimeout(() => {
          if (this.socket && this.socket.connected) {
            console.log(`📤 Retrying emit ${event}:`, data)
            this.socket.emit(event, data)
          } else {
            console.error(`❌ Failed to emit ${event} after reconnect attempt`)
          }
        }, 2000)
      }
    }
  }
} 