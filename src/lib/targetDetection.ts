export interface Target {
  id: string
  type: 'human' | 'device'
  position: { x: number; y: number }
  health: number
  isVisible: boolean
  confidence: number
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
}

export class TargetDetection {
  private videoElement: HTMLVideoElement | null = null
  private canvasElement: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private targets: Target[] = []
  private isDetecting = false

  constructor(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) {
    this.videoElement = videoElement
    this.canvasElement = canvasElement
    this.ctx = canvasElement.getContext('2d')
    this.setupCanvas()
  }

  private setupCanvas() {
    if (!this.canvasElement || !this.videoElement) return
    
    this.canvasElement.width = this.videoElement.videoWidth || window.innerWidth
    this.canvasElement.height = this.videoElement.videoHeight || window.innerHeight
  }

  // Start target detection
  startDetection() {
    this.isDetecting = true
    this.detectTargets()
  }

  // Stop target detection
  stopDetection() {
    this.isDetecting = false
  }

  // Main detection loop
  private detectTargets() {
    if (!this.isDetecting || !this.videoElement || !this.ctx) return

    // Simulate target detection (in real implementation, this would use ML models)
    this.simulateTargetDetection()
    
    // Draw targets on canvas
    this.drawTargets()
    
    // Continue detection loop
    requestAnimationFrame(() => this.detectTargets())
  }

  // Simulate target detection (replace with actual ML model)
  private simulateTargetDetection() {
    if (!this.videoElement) return

    const videoWidth = this.videoElement.videoWidth || window.innerWidth
    const videoHeight = this.videoElement.videoHeight || window.innerHeight

    // Simulate human targets based on device movement
    this.detectHumanTargets(videoWidth, videoHeight)
    
    // Simulate device-based targets
    this.detectDeviceTargets(videoWidth, videoHeight)
  }

  // Detect human targets using device sensors
  private detectHumanTargets(videoWidth: number, videoHeight: number) {
    // Simulate human detection based on device movement
    if ('DeviceMotionEvent' in window) {
      // This would use actual device motion data
      const simulatedHumans = this.generateSimulatedHumans(videoWidth, videoHeight)
      
      // Update existing human targets or add new ones
      simulatedHumans.forEach(human => {
        const existingTarget = this.targets.find(t => t.id === human.id)
        if (existingTarget) {
          existingTarget.position = human.position
          existingTarget.isVisible = human.isVisible
          existingTarget.confidence = human.confidence
        } else {
          this.targets.push(human)
        }
      })
    }
  }

  // Detect device-based targets
  private detectDeviceTargets(videoWidth: number, videoHeight: number) {
    // Simulate device-based targets (other players' devices)
    const deviceTargets = this.generateSimulatedDevices(videoWidth, videoHeight)
    
    deviceTargets.forEach(device => {
      const existingTarget = this.targets.find(t => t.id === device.id)
      if (existingTarget) {
        existingTarget.position = device.position
        existingTarget.isVisible = device.isVisible
        existingTarget.confidence = device.confidence
      } else {
        this.targets.push(device)
      }
    })
  }

  // Generate simulated human targets
  private generateSimulatedHumans(videoWidth: number, videoHeight: number): Target[] {
    const humans: Target[] = []
    
    // Simulate 2-4 human targets
    const numHumans = Math.floor(Math.random() * 3) + 2
    
    for (let i = 0; i < numHumans; i++) {
      const x = Math.random() * videoWidth
      const y = Math.random() * videoHeight
      
      humans.push({
        id: `human_${i}`,
        type: 'human',
        position: { x, y },
        health: 3,
        isVisible: Math.random() > 0.3, // 70% chance to be visible
        confidence: Math.random() * 0.5 + 0.5, // 50-100% confidence
        boundingBox: {
          x: x - 25,
          y: y - 50,
          width: 50,
          height: 100
        }
      })
    }
    
    return humans
  }

  // Generate simulated device targets
  private generateSimulatedDevices(videoWidth: number, videoHeight: number): Target[] {
    const devices: Target[] = []
    
    // Simulate 1-3 device targets
    const numDevices = Math.floor(Math.random() * 3) + 1
    
    for (let i = 0; i < numDevices; i++) {
      const x = Math.random() * videoWidth
      const y = Math.random() * videoHeight
      
      devices.push({
        id: `device_${i}`,
        type: 'device',
        position: { x, y },
        health: 2,
        isVisible: Math.random() > 0.2, // 80% chance to be visible
        confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
        boundingBox: {
          x: x - 20,
          y: y - 20,
          width: 40,
          height: 40
        }
      })
    }
    
    return devices
  }

  // Draw targets on canvas
  private drawTargets() {
    if (!this.ctx || !this.canvasElement) return
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height)
    
    // Draw each target
    this.targets.forEach(target => {
      if (!target.isVisible) return
      
      this.drawTarget(target)
    })
  }

  // Draw individual target
  private drawTarget(target: Target) {
    if (!this.ctx) return
    
    const { x, y } = target.position
    const { width, height } = target.boundingBox
    
    // Draw bounding box
    this.ctx.strokeStyle = target.type === 'human' ? '#ff4444' : '#4444ff'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(x - width/2, y - height/2, width, height)
    
    // Draw target icon
    this.ctx.fillStyle = target.type === 'human' ? '#ff4444' : '#4444ff'
    this.ctx.font = '20px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(
      target.type === 'human' ? '👤' : '📱',
      x,
      y + 10
    )
    
    // Draw health bar
    this.drawHealthBar(target, x, y - height/2 - 10)
    
    // Draw confidence indicator
    this.drawConfidenceIndicator(target, x, y + height/2 + 10)
  }

  // Draw health bar
  private drawHealthBar(target: Target, x: number, y: number) {
    if (!this.ctx) return
    
    const barWidth = 40
    const barHeight = 4
    const healthPercent = target.health / (target.type === 'human' ? 3 : 2)
    
    // Background
    this.ctx.fillStyle = '#333333'
    this.ctx.fillRect(x - barWidth/2, y, barWidth, barHeight)
    
    // Health
    this.ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000'
    this.ctx.fillRect(x - barWidth/2, y, barWidth * healthPercent, barHeight)
  }

  // Draw confidence indicator
  private drawConfidenceIndicator(target: Target, x: number, y: number) {
    if (!this.ctx) return
    
    const indicatorSize = 8
    const alpha = target.confidence
    
    this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
    this.ctx.beginPath()
    this.ctx.arc(x, y, indicatorSize, 0, 2 * Math.PI)
    this.ctx.fill()
  }

  // Get all visible targets
  getVisibleTargets(): Target[] {
    return this.targets.filter(target => target.isVisible)
  }

  // Get target by ID
  getTargetById(id: string): Target | undefined {
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
} 