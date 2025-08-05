export interface GameMessage {
  type: 'player_join' | 'player_leave' | 'position_update' | 'shoot' | 'hit' | 'elimination' | 'game_state'
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
  private ws: WebSocket | null = null
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
      this.ws = new WebSocket(`${this.serverUrl}/game?playerId=${this.playerId}`)

      this.ws.onopen = () => {
        console.log('WebSocket connected to multiplayer server')
        this.reconnectAttempts = 0
        this.sendMessage({
          type: 'player_join',
          playerId: this.playerId,
          data: { timestamp: Date.now() },
          timestamp: Date.now()
        })
      }

      this.ws.onmessage = (event) => {
        try {
          const message: GameMessage = JSON.parse(event.data)
          console.log('Received message:', message)
          this.onMessage(message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.attemptReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.connect()
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error('Max reconnection attempts reached')
    }
  }

  sendMessage(message: GameMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, message not sent:', message)
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
    if (this.ws) {
      this.sendMessage({
        type: 'player_leave',
        playerId: this.playerId,
        data: { timestamp: Date.now() },
        timestamp: Date.now()
      })
      this.ws.close()
      this.ws = null
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
} 