export interface MultiplayerTarget {
  id: string
  playerId: string
  nama: string
  tim: 'merah' | 'putih'
  position: { x: number; y: number; z: number }
  gpsLocation: { latitude: number; longitude: number }
  distance: number
  confidence: number
  isMoving: boolean
  faceDetected: boolean
  health: number
  lastSeen: number
  detectionMethod: 'gps' | 'human' | 'combined'
}

export class MultiplayerTargetDetection {
  private videoElement: HTMLVideoElement | null = null
  private canvasElement: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private targets: MultiplayerTarget[] = []
  private isDetecting = false
  private lastUpdate = Date.now()
  private currentPlayerLocation: { latitude: number; longitude: number } | null = null
  private websocket: unknown = null

  constructor(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement, websocket: unknown) {
    this.videoElement = videoElement
    this.canvasElement = canvasElement
    this.ctx = canvasElement.getContext('2d')
    this.websocket = websocket
    this.setupCanvas()
    this.initializeGPS()
  }

  private setupCanvas() {
    if (!this.canvasElement || !this.videoElement) return
    
    this.canvasElement.width = this.videoElement.videoWidth || window.innerWidth
    this.canvasElement.height = this.videoElement.videoHeight || window.innerHeight
  }

  // Initialize GPS tracking
  private async initializeGPS() {
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.currentPlayerLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
            console.log('📍 GPS Location obtained:', this.currentPlayerLocation)
            this.updatePlayerLocation()
          },
          (error) => {
            console.error('❌ GPS Error:', error)
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        )

        // Watch for location changes
        navigator.geolocation.watchPosition(
          (position) => {
            this.currentPlayerLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
            this.updatePlayerLocation()
          },
          (error) => {
            console.error('❌ GPS Watch Error:', error)
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        )
      }
    } catch (error) {
      console.error('❌ GPS initialization error:', error)
    }
  }

  // Update player location to server
  private updatePlayerLocation() {
    if (this.websocket && this.currentPlayerLocation) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.websocket as any).emit('player_location_update', {
        latitude: this.currentPlayerLocation.latitude,
        longitude: this.currentPlayerLocation.longitude,
        timestamp: Date.now()
      })
    }
  }

  // Start multiplayer target detection
  startDetection() {
    this.isDetecting = true
    this.detectMultiplayerTargets()
  }

  // Stop detection
  stopDetection() {
    this.isDetecting = false
  }

  // Main detection loop
  private detectMultiplayerTargets() {
    if (!this.isDetecting || !this.videoElement || !this.ctx) return

    const now = Date.now()
    const deltaTime = now - this.lastUpdate
    this.lastUpdate = now

    // Perform detection
    this.performMultiplayerDetection()
    
    // Update existing targets
    this.updateExistingTargets(deltaTime)
    
    // Draw targets on canvas
    this.drawMultiplayerTargets()
    
    // Continue detection loop
    requestAnimationFrame(() => this.detectMultiplayerTargets())
  }

  // Perform multiplayer detection
  private async performMultiplayerDetection() {
    if (!this.videoElement) return

    try {
      // Combine GPS-based and human detection
      this.detectGPSTargets()
      this.detectHumanTargets()
      this.combineDetections()
    } catch (error) {
      console.error('Detection error:', error)
    }
  }

  // Detect targets based on GPS location
  private detectGPSTargets() {
    if (!this.currentPlayerLocation) return

    // This would normally get data from server
    // For demo, we'll simulate nearby players
    const nearbyPlayers = this.getNearbyPlayers()
    
    nearbyPlayers.forEach(player => {
      const distance = this.calculateDistance(
        this.currentPlayerLocation!.latitude,
        this.currentPlayerLocation!.longitude,
        player.latitude,
        player.longitude
      )

      // Only show players within 500m
      if (distance <= 500) {
        this.addGPSTarget(player, distance)
      }
    })
  }

  // Detect human targets from camera
  private detectHumanTargets() {
    if (!this.videoElement || !this.canvasElement) return
    
    const videoWidth = this.videoElement.videoWidth || window.innerWidth
    const videoHeight = this.videoElement.videoHeight || window.innerHeight
    
    // Create canvas context for image analysis
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = videoWidth
    canvas.height = videoHeight
    
    // Draw video frame to canvas
    ctx.drawImage(this.videoElement, 0, 0, videoWidth, videoHeight)
    
    // Get image data for analysis
    const imageData = ctx.getImageData(0, 0, videoWidth, videoHeight)
    const data = imageData.data
    
    // Basic skin tone detection - REDUCED SENSITIVITY
    const skinTonePixels = this.detectSkinTones(data, videoWidth, videoHeight)
    
    // Only detect humans occasionally (20% chance)
    if (skinTonePixels.length > 0 && Math.random() < 0.2) {
      this.addHumanTarget(skinTonePixels, videoWidth, videoHeight)
    }
  }

  // Combine GPS and human detections
  private combineDetections() {
    // Match GPS targets with human detections
    this.targets.forEach(target => {
      if (target.detectionMethod === 'gps') {
        // Check if there's a human detection nearby
        const humanTarget = this.targets.find(t => 
          t.detectionMethod === 'human' &&
          Math.abs(t.position.x - target.position.x) < 50 &&
          Math.abs(t.position.y - target.position.y) < 50
        )
        
        if (humanTarget) {
          target.detectionMethod = 'combined'
          target.faceDetected = true
          target.confidence = Math.max(target.confidence, humanTarget.confidence)
        }
      }
    })
  }

  // Get nearby players (simulated for demo)
  private getNearbyPlayers() {
    if (!this.currentPlayerLocation) return []
    
    // Simulate nearby players - REDUCED FREQUENCY
    const nearbyPlayers = []
    const hasNearbyPlayers = Math.random() < 0.3 // Only 30% chance to have nearby players
    
    if (hasNearbyPlayers) {
      const numPlayers = Math.floor(Math.random() * 2) + 1 // 1-2 players
      
      for (let i = 0; i < numPlayers; i++) {
        const offsetLat = (Math.random() - 0.5) * 0.001 // ~100m
        const offsetLng = (Math.random() - 0.5) * 0.001 // ~100m
        
        nearbyPlayers.push({
          id: `player_${Date.now()}_${i}`,
          nama: `Player ${i + 1}`,
          tim: Math.random() > 0.5 ? 'merah' : 'putih',
          latitude: this.currentPlayerLocation.latitude + offsetLat,
          longitude: this.currentPlayerLocation.longitude + offsetLng,
          health: 100
        })
      }
    }
    
    return nearbyPlayers
  }

  // Calculate distance between two GPS coordinates
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lng2 - lng1) * Math.PI / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  // Add GPS-based target
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private addGPSTarget(player: any, distance: number) {
    const screenX = (Math.random() - 0.5) * window.innerWidth
    const screenY = (Math.random() - 0.5) * window.innerHeight
    
    this.addTarget({
      id: `gps_${player.id}`,
      playerId: player.id,
      nama: player.nama,
      tim: player.tim,
      position: { x: screenX, y: screenY, z: distance },
      gpsLocation: { latitude: player.latitude, longitude: player.longitude },
      distance,
      confidence: 0.8,
      isMoving: Math.random() > 0.7,
      faceDetected: false,
      health: player.health,
      lastSeen: Date.now(),
      detectionMethod: 'gps'
    })
  }

  // Add human target
  private addHumanTarget(skinPixels: { x: number; y: number }[], width: number, height: number) {
    if (skinPixels.length < 100) return
    
    const centerX = skinPixels.reduce((sum, p) => sum + p.x, 0) / skinPixels.length
    const centerY = skinPixels.reduce((sum, p) => sum + p.y, 0) / skinPixels.length
    
    const minX = Math.min(...skinPixels.map(p => p.x))
    const maxX = Math.max(...skinPixels.map(p => p.x))
    const minY = Math.min(...skinPixels.map(p => p.y))
    const maxY = Math.max(...skinPixels.map(p => p.y))
    
    const boxWidth = maxX - minX
    const boxHeight = maxY - minY
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    if (boxWidth > 50 && boxHeight > 100 && boxWidth < width * 0.8 && boxHeight < height * 0.8) {
      this.addTarget({
        id: `human_${Date.now()}`,
        playerId: 'unknown',
        nama: 'Unknown Player',
        tim: 'merah',
        position: { x: centerX, y: centerY, z: 200 },
        gpsLocation: { latitude: 0, longitude: 0 },
        distance: 200,
        confidence: 0.7,
        isMoving: false,
        faceDetected: true,
        health: 100,
        lastSeen: Date.now(),
        detectionMethod: 'human'
      })
    }
  }

  // Detect skin tones
  private detectSkinTones(data: Uint8ClampedArray, width: number, height: number) {
    const skinPixels: { x: number; y: number }[] = []
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      if (r > 95 && g > 40 && b > 20 && 
          Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
          Math.abs(r - g) > 15 && r > g && r > b) {
        
        const pixelIndex = i / 4
        const x = pixelIndex % width
        const y = Math.floor(pixelIndex / width)
        
        skinPixels.push({ x, y })
      }
    }
    
    return skinPixels
  }

  // Add target to list
  private addTarget(target: MultiplayerTarget) {
    const existingTarget = this.targets.find(t => t.id === target.id)
    
    if (!existingTarget) {
      this.targets.push(target)
    } else {
      existingTarget.position = target.position
      existingTarget.confidence = Math.max(existingTarget.confidence, target.confidence)
      existingTarget.lastSeen = Date.now()
      existingTarget.faceDetected = target.faceDetected || existingTarget.faceDetected
    }
  }

  // Update existing targets
  private updateExistingTargets(deltaTime: number) {
    this.targets = this.targets.filter(target => {
      // Remove targets that haven't been seen for 10 seconds
      if (Date.now() - target.lastSeen > 10000) {
        return false
      }
      
      // Update target movement
      if (target.isMoving) {
        const moveDistance = 0.5 * (deltaTime / 1000)
        target.position.x += (Math.random() - 0.5) * moveDistance * 5
        target.position.y += (Math.random() - 0.5) * moveDistance * 5
      }
      
      return true
    })
  }

  // Draw multiplayer targets (clean interface - no visual targets)
  private drawMultiplayerTargets() {
    if (!this.ctx || !this.canvasElement) return
    
    // Clear canvas - keep it clean
    this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height)
    
    // Don't draw any visual targets - keep interface clean
    // Targets are still detected but not visually displayed
  }

  // Get all detected multiplayer targets
  getDetectedTargets(): MultiplayerTarget[] {
    // Only return targets with high confidence and recent detection
    const detectedTargets = this.targets.filter(target => 
      target.confidence > 0.6 && 
      Date.now() - target.lastSeen < 5000 // Only targets seen in last 5 seconds
    )
    
    console.log('🎯 Detection Stats:', {
      totalTargets: this.targets.length,
      detectedTargets: detectedTargets.length,
      targets: this.targets.map(t => ({
        id: t.id,
        confidence: t.confidence,
        lastSeen: Date.now() - t.lastSeen,
        method: t.detectionMethod
      }))
    })
    
    return detectedTargets
  }

  // Get target by ID
  getTargetById(id: string): MultiplayerTarget | undefined {
    return this.targets.find(target => target.id === id)
  }

  // Remove target
  removeTarget(id: string) {
    this.targets = this.targets.filter(target => target.id !== id)
  }

  // Clear all targets
  clearTargets() {
    this.targets = []
  }

  // Get detection stats
  getDetectionStats() {
    const detectedTargets = this.getDetectedTargets()
    return {
      totalTargets: detectedTargets.length,
      gpsTargets: detectedTargets.filter(t => t.detectionMethod === 'gps').length,
      humanTargets: detectedTargets.filter(t => t.detectionMethod === 'human').length,
      combinedTargets: detectedTargets.filter(t => t.detectionMethod === 'combined').length,
      averageDistance: detectedTargets.reduce((sum, t) => sum + t.distance, 0) / detectedTargets.length || 0,
      averageConfidence: detectedTargets.reduce((sum, t) => sum + t.confidence, 0) / detectedTargets.length || 0
    }
  }
} 