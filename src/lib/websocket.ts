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

// Fallback multiplayer simulation for demo
export class DemoMultiplayer {
  private players: Map<string, PlayerData> = new Map()
  private messageHandlers: Map<string, (data: Record<string, unknown>) => void> = new Map()
  private interval: NodeJS.Timeout | null = null

  constructor(private playerId: string) {
    this.initializeDemoPlayers()
  }

  private initializeDemoPlayers(): void {
    // Add demo players
    this.players.set('player1', {
      id: 'player1',
      nama: 'Player 1 (Merah)',
      tim: 'merah',
      position: { x: 100, y: 100 },
      gps: { lat: -6.2088, lng: 106.8456 },
      isAlive: true,
      health: 100,
      kills: 0,
      deaths: 0,
      lastSeen: new Date()
    })

    this.players.set('player2', {
      id: 'player2',
      nama: 'Player 2 (Putih)',
      tim: 'putih',
      position: { x: 400, y: 300 },
      gps: { lat: -6.2089, lng: 106.8457 },
      isAlive: true,
      health: 100,
      kills: 0,
      deaths: 0,
      lastSeen: new Date()
    })

    // Simulate other players joining
    setTimeout(() => {
      this.players.set('player3', {
        id: 'player3',
        nama: 'Player 3 (Merah)',
        tim: 'merah',
        position: { x: 200, y: 150 },
        gps: { lat: -6.2087, lng: 106.8455 },
        isAlive: true,
        health: 100,
        kills: 0,
        deaths: 0,
        lastSeen: new Date()
      })
      this.emit('player_join', { playerId: 'player3', player: this.players.get('player3') })
    }, 2000)

    setTimeout(() => {
      this.players.set('player4', {
        id: 'player4',
        nama: 'Player 4 (Putih)',
        tim: 'putih',
        position: { x: 350, y: 250 },
        gps: { lat: -6.2090, lng: 106.8458 },
        isAlive: true,
        health: 100,
        kills: 0,
        deaths: 0,
        lastSeen: new Date()
      })
      this.emit('player_join', { playerId: 'player4', player: this.players.get('player4') })
    }, 4000)
  }

  connect(): void {
    console.log('Demo multiplayer connected')
    
    // Simulate real-time updates
    this.interval = setInterval(() => {
      // Simulate position updates from other players
      this.players.forEach((player, playerId) => {
        if (playerId !== this.playerId && player.isAlive) {
          const newPosition = {
            x: Math.random() * 600 + 50,
            y: Math.random() * 300 + 50
          }
          player.position = newPosition
          player.lastSeen = new Date()
          
          this.emit('position_update', {
            playerId,
            position: newPosition,
            gps: player.gps
          })
        }
      })
    }, 2000)
  }

  sendMessage(message: GameMessage): void {
    console.log('Demo multiplayer message:', message)
    
    // Simulate message processing
    switch (message.type) {
      case 'shoot':
        this.handleShoot(message)
        break
      case 'position_update':
        this.handlePositionUpdate(message)
        break
      case 'hit':
        this.handleHit(message)
        break
    }
  }

  private handleShoot(message: GameMessage): void {
    const { targetId, crosshairPosition } = message.data as { targetId: string; crosshairPosition: { x: number; y: number } }
    
    // Simulate hit detection
    const target = this.players.get(targetId)
    if (target && target.isAlive) {
      const distance = Math.sqrt(
        Math.pow(crosshairPosition.x - target.position.x, 2) +
        Math.pow(crosshairPosition.y - target.position.y, 2)
      )
      
      if (distance < 100) {
        // Hit!
        target.health -= 25
        if (target.health <= 0) {
          target.isAlive = false
          target.deaths += 1
          this.emit('elimination', { targetId, killedBy: message.playerId })
        }
        
        this.emit('hit', { targetId, damage: 25, shooterId: message.playerId })
      }
    }
  }

  private handlePositionUpdate(message: GameMessage): void {
    const { position, gps } = message.data as { position: { x: number; y: number }; gps: { lat: number; lng: number } }
    const player = this.players.get(message.playerId)
    if (player) {
      player.position = position
      player.gps = gps
      player.lastSeen = new Date()
    }
  }

  private handleHit(message: GameMessage): void {
    const { targetId } = message.data as { targetId: string; damage: number }
    const player = this.players.get(message.playerId)
    if (player) {
      player.kills += 1
    }
  }

  private emit(event: string, data: Record<string, unknown>): void {
    const handler = this.messageHandlers.get(event)
    if (handler) {
      handler(data)
    }
  }

  on(event: string, handler: (data: Record<string, unknown>) => void): void {
    this.messageHandlers.set(event, handler)
  }

  off(event: string): void {
    this.messageHandlers.delete(event)
  }

  disconnect(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    console.log('Demo multiplayer disconnected')
  }

  getPlayers(): PlayerData[] {
    return Array.from(this.players.values())
  }
} 