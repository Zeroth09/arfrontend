export interface AdvancedTarget {
  id: string
  type: 'human' | 'device'
  position: { x: number; y: number; z: number } // 3D position
  distance: number // Distance in meters
  health: number
  isVisible: boolean
  confidence: number
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  // Human-specific properties
  humanData?: {
    height: number // Height in meters
    movementSpeed: number // m/s
    lastSeen: number
    isMoving: boolean
    direction: { x: number; y: number; z: number }
  }
  // Device-specific properties
  deviceData?: {
    signalStrength: number // 0-100
    batteryLevel: number // 0-100
    lastPing: number
  }
}

export class AdvancedTargetDetection {
  private videoElement: HTMLVideoElement | null = null
  private canvasElement: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private targets: AdvancedTarget[] = []
  private isDetecting = false
  private playerPosition = { x: 0, y: 0, z: 0 }
  private maxDetectionRange = 500 // 500 meters
  private lastUpdate = Date.now()

  constructor(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) {
    this.videoElement = videoElement
    this.canvasElement = canvasElement
    this.ctx = canvasElement.getContext('2d')
    this.setupCanvas()
    this.initializeTargets()
  }

  private setupCanvas() {
    if (!this.canvasElement || !this.videoElement) return
    
    this.canvasElement.width = this.videoElement.videoWidth || window.innerWidth
    this.canvasElement.height = this.videoElement.videoHeight || window.innerHeight
  }

  // Initialize realistic targets at 500m range
  private initializeTargets() {
    // Create human targets at various distances
    const humanTargets = [
      { id: 'human_1', distance: 150, angle: 45, height: 1.75 },
      { id: 'human_2', distance: 300, angle: 120, height: 1.80 },
      { id: 'human_3', distance: 450, angle: 200, height: 1.70 },
      { id: 'human_4', distance: 200, angle: 320, height: 1.85 },
      { id: 'human_5', distance: 380, angle: 90, height: 1.78 }
    ]

    humanTargets.forEach(({ id, distance, angle, height }) => {
      const radians = (angle * Math.PI) / 180
      const x = Math.cos(radians) * distance
      const z = Math.sin(radians) * distance
      const y = height

      this.targets.push({
        id,
        type: 'human',
        position: { x, y, z },
        distance,
        health: 3,
        isVisible: this.calculateVisibility(distance),
        confidence: this.calculateConfidence(distance),
        boundingBox: this.calculateBoundingBox(distance, height),
        humanData: {
          height,
          movementSpeed: Math.random() * 2 + 0.5, // 0.5-2.5 m/s
          lastSeen: Date.now(),
          isMoving: Math.random() > 0.7,
          direction: { x: Math.random() - 0.5, y: 0, z: Math.random() - 0.5 }
        }
      })
    })

    // Create device targets (other players' phones)
    const deviceTargets = [
      { id: 'device_1', distance: 180, angle: 60, signalStrength: 85 },
      { id: 'device_2', distance: 250, angle: 150, signalStrength: 72 },
      { id: 'device_3', distance: 420, angle: 280, signalStrength: 45 }
    ]

    deviceTargets.forEach(({ id, distance, angle, signalStrength }) => {
      const radians = (angle * Math.PI) / 180
      const x = Math.cos(radians) * distance
      const z = Math.sin(radians) * distance
      const y = 1.5 // Phone held at chest level

      this.targets.push({
        id,
        type: 'device',
        position: { x, y, z },
        distance,
        health: 2,
        isVisible: this.calculateVisibility(distance),
        confidence: this.calculateConfidence(distance),
        boundingBox: this.calculateBoundingBox(distance, 0.1), // Small device
        deviceData: {
          signalStrength,
          batteryLevel: Math.random() * 100,
          lastPing: Date.now()
        }
      })
    })
  }

  // Calculate visibility based on distance and environmental factors
  private calculateVisibility(distance: number): boolean {
    if (distance > this.maxDetectionRange) return false
    
    // Visibility decreases with distance
    const visibilityChance = Math.max(0.1, 1 - (distance / this.maxDetectionRange))
    
    // Environmental factors (fog, obstacles, etc.)
    const environmentalFactor = Math.random() * 0.3 + 0.7 // 70-100%
    
    return Math.random() < (visibilityChance * environmentalFactor)
  }

  // Calculate confidence based on distance and target type
  private calculateConfidence(distance: number): number {
    const baseConfidence = Math.max(0.1, 1 - (distance / this.maxDetectionRange))
    
    // Add some randomness to simulate real-world conditions
    const noise = (Math.random() - 0.5) * 0.2
    return Math.max(0, Math.min(1, baseConfidence + noise))
  }

  // Calculate bounding box size based on distance and target size
  private calculateBoundingBox(distance: number, targetHeight: number): {
    x: number
    y: number
    width: number
    height: number
  } {
    // Perspective projection: closer objects appear larger
    const perspectiveFactor = 1000 / distance // Inverse distance scaling
    
    const width = targetHeight * perspectiveFactor * 0.5 // Human width ratio
    const height = targetHeight * perspectiveFactor
    
    // Center on screen
    const screenWidth = this.canvasElement?.width || window.innerWidth
    const screenHeight = this.canvasElement?.height || window.innerHeight
    
    return {
      x: screenWidth / 2 - width / 2,
      y: screenHeight / 2 - height / 2,
      width,
      height
    }
  }

  // Start detection
  startDetection() {
    this.isDetecting = true
    this.detectTargets()
  }

  // Stop detection
  stopDetection() {
    this.isDetecting = false
  }

  // Main detection loop
  private detectTargets() {
    if (!this.isDetecting || !this.videoElement || !this.ctx) return

    const now = Date.now()
    const deltaTime = now - this.lastUpdate
    this.lastUpdate = now

    // Update target positions and visibility
    this.updateTargets(deltaTime)
    
    // Draw targets
    this.drawTargets()
    
    // Continue loop
    requestAnimationFrame(() => this.detectTargets())
  }

  // Update target positions and states
  private updateTargets(deltaTime: number) {
    this.targets.forEach(target => {
      // Update human movement
      if (target.type === 'human' && target.humanData) {
        this.updateHumanMovement(target, deltaTime)
      }
      
      // Update device signals
      if (target.type === 'device' && target.deviceData) {
        this.updateDeviceSignal(target, deltaTime)
      }
      
      // Update visibility based on new position
      target.isVisible = this.calculateVisibility(target.distance)
      target.confidence = this.calculateConfidence(target.distance)
      
      // Update bounding box
      const height = target.type === 'human' ? target.humanData?.height || 1.75 : 0.1
      target.boundingBox = this.calculateBoundingBox(target.distance, height)
    })
  }

  // Update human movement patterns
  private updateHumanMovement(target: AdvancedTarget, deltaTime: number) {
    if (!target.humanData) return
    
    const { humanData } = target
    
    if (humanData.isMoving) {
      // Move in current direction
      const moveDistance = humanData.movementSpeed * (deltaTime / 1000)
      
      target.position.x += humanData.direction.x * moveDistance
      target.position.z += humanData.direction.z * moveDistance
      
      // Update distance from player
      target.distance = Math.sqrt(
        Math.pow(target.position.x - this.playerPosition.x, 2) +
        Math.pow(target.position.z - this.playerPosition.z, 2)
      )
      
      // Randomly change direction
      if (Math.random() < 0.01) { // 1% chance per frame
        humanData.direction = {
          x: Math.random() - 0.5,
          y: 0,
          z: Math.random() - 0.5
        }
        // Normalize direction
        const length = Math.sqrt(
          Math.pow(humanData.direction.x, 2) + 
          Math.pow(humanData.direction.z, 2)
        )
        humanData.direction.x /= length
        humanData.direction.z /= length
      }
      
      // Randomly stop/start moving
      if (Math.random() < 0.005) { // 0.5% chance per frame
        humanData.isMoving = !humanData.isMoving
      }
    }
    
    humanData.lastSeen = Date.now()
  }

  // Update device signal strength
  private updateDeviceSignal(target: AdvancedTarget, deltaTime: number) {
    if (!target.deviceData) return
    
    const { deviceData } = target
    
    // Simulate signal fluctuations
    deviceData.signalStrength += (Math.random() - 0.5) * 2
    deviceData.signalStrength = Math.max(0, Math.min(100, deviceData.signalStrength))
    
    // Battery drain
    deviceData.batteryLevel -= 0.01 * (deltaTime / 1000) // 1% per second
    deviceData.batteryLevel = Math.max(0, deviceData.batteryLevel)
    
    // Update ping time
    deviceData.lastPing = Date.now()
  }

  // Draw targets with realistic rendering
  private drawTargets() {
    if (!this.ctx || !this.canvasElement) return
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height)
    
    // Sort targets by distance (closer targets drawn on top)
    const sortedTargets = [...this.targets].sort((a, b) => a.distance - b.distance)
    
    sortedTargets.forEach(target => {
      if (!target.isVisible) return
      
      this.drawAdvancedTarget(target)
    })
  }

  // Draw individual target with advanced rendering
  private drawAdvancedTarget(target: AdvancedTarget) {
    if (!this.ctx) return
    
    const { x, y, width, height } = target.boundingBox
    
    // Draw distance indicator
    this.drawDistanceIndicator(target, x + width/2, y - 10)
    
    // Draw target based on type
    if (target.type === 'human') {
      this.drawHumanTarget(target, x, y, width, height)
    } else {
      this.drawDeviceTarget(target, x, y, width, height)
    }
    
    // Draw health bar
    this.drawHealthBar(target, x, y - 20)
    
    // Draw confidence indicator
    this.drawConfidenceIndicator(target, x + width/2, y + height + 10)
  }

  // Draw human target with realistic appearance
  private drawHumanTarget(target: AdvancedTarget, x: number, y: number, width: number, height: number) {
    if (!this.ctx) return
    
    const centerX = x + width/2
    const centerY = y + height/2
    
    // Draw human silhouette
    this.ctx.fillStyle = `rgba(255, 68, 68, ${target.confidence})`
    this.ctx.strokeStyle = '#ff4444'
    this.ctx.lineWidth = 2
    
    // Head
    const headRadius = Math.min(width, height) * 0.15
    this.ctx.beginPath()
    this.ctx.arc(centerX, y + headRadius, headRadius, 0, 2 * Math.PI)
    this.ctx.fill()
    this.ctx.stroke()
    
    // Body
    this.ctx.fillRect(centerX - width * 0.2, y + headRadius * 2, width * 0.4, height * 0.6)
    
    // Arms
    this.ctx.fillRect(centerX - width * 0.4, y + headRadius * 2.5, width * 0.15, height * 0.4)
    this.ctx.fillRect(centerX + width * 0.25, y + headRadius * 2.5, width * 0.15, height * 0.4)
    
    // Legs
    this.ctx.fillRect(centerX - width * 0.15, y + height * 0.8, width * 0.12, height * 0.2)
    this.ctx.fillRect(centerX + width * 0.03, y + height * 0.8, width * 0.12, height * 0.2)
    
    // Movement indicator
    if (target.humanData?.isMoving) {
      this.ctx.fillStyle = '#00ff00'
      this.ctx.font = '12px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('🏃', centerX, y - 5)
    }
  }

  // Draw device target
  private drawDeviceTarget(target: AdvancedTarget, x: number, y: number, width: number, height: number) {
    if (!this.ctx) return
    
    const centerX = x + width/2
    const centerY = y + height/2
    
    // Draw device icon
    this.ctx.fillStyle = `rgba(68, 68, 255, ${target.confidence})`
    this.ctx.strokeStyle = '#4444ff'
    this.ctx.lineWidth = 2
    
    // Phone shape
    this.ctx.fillRect(x, y, width, height)
    this.ctx.strokeRect(x, y, width, height)
    
    // Screen
    this.ctx.fillStyle = '#000000'
    this.ctx.fillRect(x + width * 0.1, y + height * 0.1, width * 0.8, height * 0.8)
    
    // Signal indicator
    if (target.deviceData) {
      const signalBars = Math.floor(target.deviceData.signalStrength / 20)
      this.ctx.fillStyle = '#00ff00'
      for (let i = 0; i < signalBars; i++) {
        this.ctx.fillRect(centerX - 10 + i * 3, y - 15, 2, 8 - i * 2)
      }
    }
  }

  // Draw distance indicator
  private drawDistanceIndicator(target: AdvancedTarget, x: number, y: number) {
    if (!this.ctx) return
    
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = '10px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(`${Math.round(target.distance)}m`, x, y)
  }

  // Draw health bar
  private drawHealthBar(target: AdvancedTarget, x: number, y: number) {
    if (!this.ctx) return
    
    const barWidth = 40
    const barHeight = 4
    const maxHealth = target.type === 'human' ? 3 : 2
    const healthPercent = target.health / maxHealth
    
    // Background
    this.ctx.fillStyle = '#333333'
    this.ctx.fillRect(x, y, barWidth, barHeight)
    
    // Health
    this.ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000'
    this.ctx.fillRect(x, y, barWidth * healthPercent, barHeight)
  }

  // Draw confidence indicator
  private drawConfidenceIndicator(target: AdvancedTarget, x: number, y: number) {
    if (!this.ctx) return
    
    const indicatorSize = 6
    const alpha = target.confidence
    
    this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
    this.ctx.beginPath()
    this.ctx.arc(x, y, indicatorSize, 0, 2 * Math.PI)
    this.ctx.fill()
  }

  // Get visible targets
  getVisibleTargets(): AdvancedTarget[] {
    return this.targets.filter(target => target.isVisible)
  }

  // Get target by ID
  getTargetById(id: string): AdvancedTarget | undefined {
    return this.targets.find(target => target.id === id)
  }

  // Update target health
  updateTargetHealth(id: string, newHealth: number) {
    const target = this.getTargetById(id)
    if (target) {
      target.health = Math.max(0, newHealth)
      if (target.health === 0) {
        target.isVisible = false
      }
    }
  }

  // Remove target
  removeTarget(id: string) {
    this.targets = this.targets.filter(target => target.id !== id)
  }

  // Clear all targets
  clearTargets() {
    this.targets = []
  }

  // Update player position
  updatePlayerPosition(x: number, y: number, z: number) {
    this.playerPosition = { x, y, z }
    
    // Update target distances
    this.targets.forEach(target => {
      target.distance = Math.sqrt(
        Math.pow(target.position.x - x, 2) +
        Math.pow(target.position.z - z, 2)
      )
    })
  }
} 