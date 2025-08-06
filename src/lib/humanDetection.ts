export interface HumanTarget {
  id: string
  position: { x: number; y: number; z: number }
  distance: number
  confidence: number
  isMoving: boolean
  movementSpeed: number
  height: number
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  lastSeen: number
}

export class HumanDetection {
  private videoElement: HTMLVideoElement | null = null
  private canvasElement: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private humans: HumanTarget[] = []
  private isDetecting = false
  private lastUpdate = Date.now()
  private deviceMotionData: { x: number; y: number; z: number } | null = null
  private deviceOrientationData: { alpha: number; beta: number; gamma: number } | null = null

  constructor(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) {
    this.videoElement = videoElement
    this.canvasElement = canvasElement
    this.ctx = canvasElement.getContext('2d')
    this.setupCanvas()
    this.initializeDeviceSensors()
  }

  private setupCanvas() {
    if (!this.canvasElement || !this.videoElement) return
    
    this.canvasElement.width = this.videoElement.videoWidth || window.innerWidth
    this.canvasElement.height = this.videoElement.videoHeight || window.innerHeight
  }

  // Initialize device motion and orientation sensors
  private initializeDeviceSensors() {
    // Device Motion (acceleration)
    if ('DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', (event) => {
        if (event.accelerationIncludingGravity) {
          this.deviceMotionData = {
            x: event.accelerationIncludingGravity.x || 0,
            y: event.accelerationIncludingGravity.y || 0,
            z: event.accelerationIncludingGravity.z || 0
          }
        }
      })
    }

    // Device Orientation (gyroscope)
    if ('DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', (event) => {
        this.deviceOrientationData = {
          alpha: event.alpha || 0,
          beta: event.beta || 0,
          gamma: event.gamma || 0
        }
      })
    }
  }

  // Start human detection
  startDetection() {
    this.isDetecting = true
    this.detectHumans()
  }

  // Stop human detection
  stopDetection() {
    this.isDetecting = false
  }

  // Main detection loop
  private detectHumans() {
    if (!this.isDetecting || !this.videoElement || !this.ctx) return

    const now = Date.now()
    const deltaTime = now - this.lastUpdate
    this.lastUpdate = now

    // Update human positions and detect new humans
    this.updateHumanDetection(deltaTime)
    
    // Draw humans on canvas
    this.drawHumans()
    
    // Continue detection loop
    requestAnimationFrame(() => this.detectHumans())
  }

  // Update human detection based on device sensors and camera
  private updateHumanDetection(deltaTime: number) {
    if (!this.videoElement) return

    const videoWidth = this.videoElement.videoWidth || window.innerWidth
    const videoHeight = this.videoElement.videoHeight || window.innerHeight

    // Detect humans based on device movement patterns
    this.detectHumansFromMotion(videoWidth, videoHeight)
    
    // Detect humans based on camera analysis (simulated)
    this.detectHumansFromCamera(videoWidth, videoHeight)
    
    // Update existing humans
    this.updateExistingHumans(deltaTime)
  }

  // Detect humans based on device motion patterns
  private detectHumansFromMotion(videoWidth: number, videoHeight: number) {
    if (!this.deviceMotionData) return

    // Simulate human detection based on device movement
    // In real implementation, this would use ML models to analyze motion patterns
    
    const motionThreshold = 2.0 // Threshold for significant motion
    const motionMagnitude = Math.sqrt(
      Math.pow(this.deviceMotionData.x, 2) + 
      Math.pow(this.deviceMotionData.y, 2) + 
      Math.pow(this.deviceMotionData.z, 2)
    )

    // If device is moving significantly, detect potential humans
    if (motionMagnitude > motionThreshold) {
      this.generateHumanTargets(videoWidth, videoHeight, motionMagnitude)
    }
  }

  // Detect humans from camera analysis (simulated)
  private detectHumansFromCamera(videoWidth: number, videoHeight: number) {
    // Simulate camera-based human detection
    // In real implementation, this would use computer vision models
    
    const detectionChance = 0.01 // 1% chance per frame
    if (Math.random() < detectionChance) {
      this.generateHumanTargets(videoWidth, videoHeight, 1.0)
    }
  }

  // Generate human targets based on detection
  private generateHumanTargets(videoWidth: number, videoHeight: number, confidence: number) {
    const numHumans = Math.floor(Math.random() * 2) + 1 // 1-2 humans at a time
    
    for (let i = 0; i < numHumans; i++) {
      const x = Math.random() * videoWidth
      const y = Math.random() * videoHeight
      const distance = Math.random() * 300 + 100 // 100-400m
      
      const human: HumanTarget = {
        id: `human_${Date.now()}_${i}`,
        position: { x, y, z: distance },
        distance,
        confidence: Math.min(0.9, confidence + Math.random() * 0.2),
        isMoving: Math.random() > 0.5,
        movementSpeed: Math.random() * 2 + 0.5, // 0.5-2.5 m/s
        height: Math.random() * 0.3 + 1.6, // 1.6-1.9m
        boundingBox: {
          x: x - 25,
          y: y - 50,
          width: 50,
          height: 100
        },
        lastSeen: Date.now()
      }
      
      // Add human if not already detected
      const existingHuman = this.humans.find(h => 
        Math.abs(h.position.x - x) < 50 && Math.abs(h.position.y - y) < 50
      )
      
      if (!existingHuman) {
        this.humans.push(human)
      }
    }
  }

  // Update existing humans
  private updateExistingHumans(deltaTime: number) {
    this.humans = this.humans.filter(human => {
      // Remove humans that haven't been seen for 30 seconds
      if (Date.now() - human.lastSeen > 30000) {
        return false
      }
      
      // Update human movement
      if (human.isMoving) {
        const moveDistance = human.movementSpeed * (deltaTime / 1000)
        human.position.x += (Math.random() - 0.5) * moveDistance * 10
        human.position.y += (Math.random() - 0.5) * moveDistance * 10
        
        // Update bounding box
        human.boundingBox.x = human.position.x - 25
        human.boundingBox.y = human.position.y - 50
      }
      
      // Update last seen
      human.lastSeen = Date.now()
      
      return true
    })
  }

  // Draw humans on canvas
  private drawHumans() {
    if (!this.ctx || !this.canvasElement) return
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height)
    
    // Draw each human
    this.humans.forEach(human => {
      this.drawHuman(human)
    })
  }

  // Draw individual human
  private drawHuman(human: HumanTarget) {
    if (!this.ctx) return
    
    const { x, y, width, height } = human.boundingBox
    const centerX = x + width/2
    const centerY = y + height/2
    
    // Draw human silhouette
    this.ctx.fillStyle = `rgba(255, 68, 68, ${human.confidence})`
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
    if (human.isMoving) {
      this.ctx.fillStyle = '#00ff00'
      this.ctx.font = '12px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('🏃', centerX, y - 5)
    }
    
    // Distance indicator
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = '10px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(`${Math.round(human.distance)}m`, centerX, y + height + 15)
    
    // Confidence indicator
    const confidenceSize = 6
    this.ctx.fillStyle = `rgba(255, 255, 255, ${human.confidence})`
    this.ctx.beginPath()
    this.ctx.arc(centerX, y + height + 25, confidenceSize, 0, 2 * Math.PI)
    this.ctx.fill()
  }

  // Get all detected humans
  getDetectedHumans(): HumanTarget[] {
    return this.humans.filter(human => human.confidence > 0.3)
  }

  // Get human by ID
  getHumanById(id: string): HumanTarget | undefined {
    return this.humans.find(human => human.id === id)
  }

  // Remove human
  removeHuman(id: string) {
    this.humans = this.humans.filter(human => human.id !== id)
  }

  // Clear all humans
  clearHumans() {
    this.humans = []
  }

  // Get detection stats
  getDetectionStats() {
    return {
      totalHumans: this.humans.length,
      movingHumans: this.humans.filter(h => h.isMoving).length,
      averageConfidence: this.humans.reduce((sum, h) => sum + h.confidence, 0) / this.humans.length || 0,
      averageDistance: this.humans.reduce((sum, h) => sum + h.distance, 0) / this.humans.length || 0
    }
  }
} 