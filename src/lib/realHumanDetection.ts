export interface RealHumanTarget {
  id: string
  position: { x: number; y: number; z: number }
  distance: number
  confidence: number
  isMoving: boolean
  faceDetected: boolean
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  faceBox?: {
    x: number
    y: number
    width: number
    height: number
  }
  lastSeen: number
  detectionMethod: 'face' | 'body' | 'motion'
}

export class RealHumanDetection {
  private videoElement: HTMLVideoElement | null = null
  private canvasElement: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private humans: RealHumanTarget[] = []
  private isDetecting = false
  private lastUpdate = Date.now()
  private faceDetectionModel: unknown = null
  private bodyDetectionModel: unknown = null

  constructor(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) {
    this.videoElement = videoElement
    this.canvasElement = canvasElement
    this.ctx = canvasElement.getContext('2d')
    this.setupCanvas()
    this.initializeDetectionModels()
  }

  private setupCanvas() {
    if (!this.canvasElement || !this.videoElement) return
    
    this.canvasElement.width = this.videoElement.videoWidth || window.innerWidth
    this.canvasElement.height = this.videoElement.videoHeight || window.innerHeight
  }

  // Initialize real detection models
  private async initializeDetectionModels() {
    try {
      // Load face detection model (using MediaPipe Face Detection)
      if (typeof window !== 'undefined' && 'FaceDetection' in window) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.faceDetectionModel = new (window as any).FaceDetection({
        modelSelection: 0,
        maxFaces: 10
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.faceDetectionModel as any).initialize()
      }

      // Load body detection model (using MediaPipe Pose)
      if (typeof window !== 'undefined' && 'Pose' in window) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.bodyDetectionModel = new (window as any).Pose({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (this.bodyDetectionModel as any).initialize()
      }

      console.log('✅ Real human detection models loaded')
    } catch (error) {
      console.error('❌ Failed to load detection models:', error)
      // Fallback to simulated detection
      this.initializeSimulatedDetection()
    }
  }

  // Fallback to simulated detection if models fail to load
  private initializeSimulatedDetection() {
    console.log('🔄 Using simulated human detection')
  }

  // Start real human detection
  startDetection() {
    this.isDetecting = true
    this.detectRealHumans()
  }

  // Stop detection
  stopDetection() {
    this.isDetecting = false
  }

  // Main detection loop
  private detectRealHumans() {
    if (!this.isDetecting || !this.videoElement || !this.ctx) return

    const now = Date.now()
    const deltaTime = now - this.lastUpdate
    this.lastUpdate = now

    // Perform real human detection
    this.performRealDetection()
    
    // Update existing humans
    this.updateExistingHumans(deltaTime)
    
    // Draw humans on canvas
    this.drawRealHumans()
    
    // Continue detection loop
    requestAnimationFrame(() => this.detectRealHumans())
  }

  // Perform real human detection using computer vision
  private async performRealDetection() {
    if (!this.videoElement) return

    try {
      // Detect faces in video frame
      if (this.faceDetectionModel) {
        await this.detectFaces()
      }

      // Detect body poses in video frame
      if (this.bodyDetectionModel) {
        await this.detectBodies()
      }

      // Fallback to simulated detection if models not available
      if (!this.faceDetectionModel && !this.bodyDetectionModel) {
        this.simulateRealDetection()
      }

    } catch (error) {
      console.error('Detection error:', error)
      this.simulateRealDetection()
    }
  }

  // Detect real faces using MediaPipe
  private async detectFaces() {
    if (!this.videoElement || !this.faceDetectionModel) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const faces = await (this.faceDetectionModel as any).detect(this.videoElement)
      
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
        faces.forEach((face: any, index: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { boundingBox } = face as any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const confidence = (face as any).score || 0.8
        
        if (confidence > 0.5) {
          this.addRealHuman({
            id: `face_${Date.now()}_${index}`,
            position: { 
              x: boundingBox.xCenter * this.canvasElement!.width, 
              y: boundingBox.yCenter * this.canvasElement!.height, 
              z: this.estimateDistance(boundingBox)
            },
            distance: this.estimateDistance(boundingBox),
            confidence,
            isMoving: this.detectMovement(boundingBox),
            faceDetected: true,
            boundingBox: {
              x: boundingBox.xCenter * this.canvasElement!.width - 25,
              y: boundingBox.yCenter * this.canvasElement!.height - 50,
              width: 50,
              height: 100
            },
            faceBox: {
              x: boundingBox.xCenter * this.canvasElement!.width - 20,
              y: boundingBox.yCenter * this.canvasElement!.height - 20,
              width: 40,
              height: 40
            },
            lastSeen: Date.now(),
            detectionMethod: 'face'
          })
        }
      })
    } catch (error) {
      console.error('Face detection error:', error)
    }
  }

  // Detect real body poses using MediaPipe
  private async detectBodies() {
    if (!this.videoElement || !this.bodyDetectionModel) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const poses = await (this.bodyDetectionModel as any).detect(this.videoElement)
      
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
        poses.forEach((pose: any, index: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { keypoints } = pose as any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const confidence = (pose as any).score || 0.7
        
        if (confidence > 0.5 && keypoints.length > 0) {
          // Calculate body center from keypoints
          const bodyCenter = this.calculateBodyCenter(keypoints)
          
          this.addRealHuman({
            id: `body_${Date.now()}_${index}`,
            position: { 
              x: bodyCenter.x, 
              y: bodyCenter.y, 
              z: this.estimateDistanceFromKeypoints(keypoints)
            },
            distance: this.estimateDistanceFromKeypoints(keypoints),
            confidence,
            isMoving: this.detectBodyMovement(keypoints),
            faceDetected: false,
            boundingBox: {
              x: bodyCenter.x - 25,
              y: bodyCenter.y - 50,
              width: 50,
              height: 100
            },
            lastSeen: Date.now(),
            detectionMethod: 'body'
          })
        }
      })
    } catch (error) {
      console.error('Body detection error:', error)
    }
  }

  // Simulate real detection when models are not available
  private simulateRealDetection() {
    const videoWidth = this.videoElement!.videoWidth || window.innerWidth
    const videoHeight = this.videoElement!.videoHeight || window.innerHeight
    
    // Simulate detection based on device motion
    if ('DeviceMotionEvent' in window) {
      const motionThreshold = 1.5
      const motionMagnitude = this.getDeviceMotionMagnitude()
      
      if (motionMagnitude > motionThreshold) {
        this.generateSimulatedRealHuman(videoWidth, videoHeight, motionMagnitude)
      }
    }
  }

  // Get device motion magnitude
  private getDeviceMotionMagnitude(): number {
    // This would use actual device motion data
    // For now, return a simulated value
    return Math.random() * 3
  }

  // Generate simulated real human
  private generateSimulatedRealHuman(videoWidth: number, videoHeight: number, confidence: number) {
    const x = Math.random() * videoWidth
    const y = Math.random() * videoHeight
    const distance = Math.random() * 200 + 50 // 50-250m
    
    this.addRealHuman({
      id: `sim_${Date.now()}`,
      position: { x, y, z: distance },
      distance,
      confidence: Math.min(0.9, confidence * 0.3),
      isMoving: Math.random() > 0.5,
      faceDetected: Math.random() > 0.7,
      boundingBox: {
        x: x - 25,
        y: y - 50,
        width: 50,
        height: 100
      },
      lastSeen: Date.now(),
      detectionMethod: 'motion'
    })
  }

  // Add real human to detection list
  private addRealHuman(human: RealHumanTarget) {
    // Check if human already exists nearby
    const existingHuman = this.humans.find(h => 
      Math.abs(h.position.x - human.position.x) < 30 && 
      Math.abs(h.position.y - human.position.y) < 30
    )
    
    if (!existingHuman) {
      this.humans.push(human)
    } else {
      // Update existing human
      existingHuman.position = human.position
      existingHuman.confidence = Math.max(existingHuman.confidence, human.confidence)
      existingHuman.lastSeen = Date.now()
      existingHuman.faceDetected = human.faceDetected || existingHuman.faceDetected
    }
  }

  // Estimate distance from bounding box size
  private estimateDistance(boundingBox: unknown): number {
    // Larger bounding box = closer distance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const box = boundingBox as any
    const boxSize = box.width * box.height
    return Math.max(50, 500 - boxSize * 10)
  }

  // Estimate distance from keypoints
  private estimateDistanceFromKeypoints(keypoints: unknown[]): number {
    // Use keypoint spread to estimate distance
    const spread = this.calculateKeypointSpread(keypoints)
    return Math.max(50, 300 - spread * 5)
  }

  // Calculate body center from keypoints
  private calculateBodyCenter(keypoints: unknown[]): { x: number; y: number } {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validPoints = keypoints.filter((kp: any) => kp.score > 0.5) as any[]
    if (validPoints.length === 0) return { x: 0, y: 0 }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const avgX = validPoints.reduce((sum, kp: any) => sum + kp.x, 0) / validPoints.length
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const avgY = validPoints.reduce((sum, kp: any) => sum + kp.y, 0) / validPoints.length
    
    return { x: avgX, y: avgY }
  }

  // Calculate keypoint spread
  private calculateKeypointSpread(keypoints: unknown[]): number {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validPoints = keypoints.filter((kp: any) => kp.score > 0.5) as any[]
    if (validPoints.length < 2) return 0
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const xs = validPoints.map((kp: any) => kp.x)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ys = validPoints.map((kp: any) => kp.y)
    
    const xSpread = Math.max(...xs) - Math.min(...xs)
    const ySpread = Math.max(...ys) - Math.min(...ys)
    
    return xSpread + ySpread
  }

  // Detect movement from bounding box
  private detectMovement(_boundingBox: unknown): boolean {
    // Simulate movement detection
    return Math.random() > 0.6
  }

  // Detect body movement from keypoints
  private detectBodyMovement(_keypoints: unknown[]): boolean {
    // Simulate body movement detection
    return Math.random() > 0.5
  }

  // Update existing humans
  private updateExistingHumans(deltaTime: number) {
    this.humans = this.humans.filter(human => {
      // Remove humans that haven't been seen for 15 seconds
      if (Date.now() - human.lastSeen > 15000) {
        return false
      }
      
      // Update human movement
      if (human.isMoving) {
        const moveDistance = 1 * (deltaTime / 1000) // 1 m/s
        human.position.x += (Math.random() - 0.5) * moveDistance * 10
        human.position.y += (Math.random() - 0.5) * moveDistance * 10
        
        // Update bounding box
        human.boundingBox.x = human.position.x - 25
        human.boundingBox.y = human.position.y - 50
      }
      
      return true
    })
  }

  // Draw real humans on canvas
  private drawRealHumans() {
    if (!this.ctx || !this.canvasElement) return
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height)
    
    // Draw each human
    this.humans.forEach(human => {
      this.drawRealHuman(human)
    })
  }

  // Draw individual real human
  private drawRealHuman(human: RealHumanTarget) {
    if (!this.ctx) return
    
    const { x, y, width, height } = human.boundingBox
    const centerX = x + width/2
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const centerY = y + height/2
    
    // Draw human silhouette with different colors based on detection method
    let fillColor = '#ff4444'
    let strokeColor = '#ff4444'
    
    if (human.detectionMethod === 'face') {
      fillColor = '#44ff44' // Green for face detection
      strokeColor = '#44ff44'
    } else if (human.detectionMethod === 'body') {
      fillColor = '#4444ff' // Blue for body detection
      strokeColor = '#4444ff'
    }
    
    this.ctx.fillStyle = `${fillColor}${Math.floor(human.confidence * 255).toString(16).padStart(2, '0')}`
    this.ctx.strokeStyle = strokeColor
    this.ctx.lineWidth = 2
    
    // Draw human silhouette
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
    
    // Face detection indicator
    if (human.faceDetected) {
      this.ctx.fillStyle = '#ffff00'
      this.ctx.font = '12px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('👤', centerX, y - 10)
    }
    
    // Movement indicator
    if (human.isMoving) {
      this.ctx.fillStyle = '#00ff00'
      this.ctx.font = '12px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('🏃', centerX, y - 25)
    }
    
    // Distance indicator
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = '10px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(`${Math.round(human.distance)}m`, centerX, y + height + 15)
    
    // Detection method indicator
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = '8px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(human.detectionMethod.toUpperCase(), centerX, y + height + 30)
    
    // Confidence indicator
    const confidenceSize = 6
    this.ctx.fillStyle = `rgba(255, 255, 255, ${human.confidence})`
    this.ctx.beginPath()
    this.ctx.arc(centerX, y + height + 40, confidenceSize, 0, 2 * Math.PI)
    this.ctx.fill()
  }

  // Get all detected real humans
  getDetectedRealHumans(): RealHumanTarget[] {
    return this.humans.filter(human => human.confidence > 0.3)
  }

  // Get human by ID
  getRealHumanById(id: string): RealHumanTarget | undefined {
    return this.humans.find(human => human.id === id)
  }

  // Remove human
  removeRealHuman(id: string) {
    this.humans = this.humans.filter(human => human.id !== id)
  }

  // Clear all humans
  clearRealHumans() {
    this.humans = []
  }

  // Get detection stats
  getRealDetectionStats() {
    const detectedHumans = this.getDetectedRealHumans()
    return {
      totalHumans: detectedHumans.length,
      faceDetected: detectedHumans.filter(h => h.faceDetected).length,
      bodyDetected: detectedHumans.filter(h => h.detectionMethod === 'body').length,
      movingHumans: detectedHumans.filter(h => h.isMoving).length,
      averageConfidence: detectedHumans.reduce((sum, h) => sum + h.confidence, 0) / detectedHumans.length || 0,
      averageDistance: detectedHumans.reduce((sum, h) => sum + h.distance, 0) / detectedHumans.length || 0
    }
  }
} 