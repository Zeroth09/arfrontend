'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { TargetDetection, Target } from '@/lib/targetDetection'

interface GameState {
  status: 'waiting' | 'playing' | 'finished'
  timeLeft: number
  currentPlayer: {
    id: string
    nama: string
    tim: 'merah' | 'putih'
    health: number
    kills: number
    deaths: number
  }
  targets: Array<{
    id: string
    type: 'human' | 'device'
    position: { x: number; y: number }
    health: number
    isVisible: boolean
  }>
}

export default function GamePage() {
  const router = useRouter()
  const [gameState, setGameState] = useState<GameState>({
    status: 'waiting',
    timeLeft: 300, // 5 menit
    currentPlayer: {
      id: '',
      nama: '',
      tim: 'merah',
      health: 3, // 3 nyawa
      kills: 0,
      deaths: 0
    },
    targets: []
  })

  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isShooting, setIsShooting] = useState(false)
  const [crosshairPosition, setCrosshairPosition] = useState({ x: 0, y: 0 })
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const targetDetectionRef = useRef<TargetDetection | null>(null)

  // Initialize game
  useEffect(() => {
    const playerData = localStorage.getItem('playerData')
    if (playerData) {
      const player = JSON.parse(playerData)
      setGameState(prev => ({
        ...prev,
        currentPlayer: {
          id: player.id,
          nama: player.nama,
          tim: player.tim,
          health: 3,
          kills: 0,
          deaths: 0
        },
        status: 'playing'
      }))
    }

    // Start game timer
    gameIntervalRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 1) {
          return { ...prev, status: 'finished', timeLeft: 0 }
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 }
      })
    }, 1000)

    // Initialize camera
    initializeCamera()

    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current)
      }
      stopCamera()
    }
  }, [])

  // Initialize camera and AR
  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      })
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCameraActive(true)
        
        // Initialize target detection after camera is ready
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current && canvasRef.current) {
            targetDetectionRef.current = new TargetDetection(videoRef.current, canvasRef.current)
            targetDetectionRef.current.startDetection()
          }
        }
      }
    } catch (error) {
      console.error('Camera access denied:', error)
      // Fallback to demo mode
      setIsCameraActive(true)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    
    // Stop target detection
    if (targetDetectionRef.current) {
      targetDetectionRef.current.stopDetection()
    }
  }

  // Handle shooting
  const handleShoot = () => {
    if (isShooting) return // Prevent rapid firing
    
    setIsShooting(true)
    
    // Add shooting sound effect
    playShootSound()
    
    // Check if hit target
    const hitTarget = checkTargetHit()
    if (hitTarget) {
      handleTargetHit(hitTarget)
    }
    
    // Reset shooting state
    setTimeout(() => setIsShooting(false), 200)
  }

  // Play shoot sound
  const playShootSound = () => {
    // Create audio context for sound effects
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const audioContext = new AudioContextClass()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  }

  // Check if shot hits target
  const checkTargetHit = () => {
    if (!targetDetectionRef.current) return null
    
    const screenCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const hitRadius = 50 // Hit radius in pixels
    
    const visibleTargets = targetDetectionRef.current.getVisibleTargets()
    return visibleTargets.find(target => {
      const distance = Math.sqrt(
        Math.pow(target.position.x - screenCenter.x, 2) + 
        Math.pow(target.position.y - screenCenter.y, 2)
      )
      return distance < hitRadius
    })
  }

  // Handle target hit
  const handleTargetHit = (target: Target) => {
    // Vibrate device
    if ('vibrate' in navigator) {
      navigator.vibrate(200)
    }
    
    // Update target health in detection system
    if (targetDetectionRef.current) {
      targetDetectionRef.current.updateTargetHealth(target.id, target.health - 1)
    }
    
    // Check if target is eliminated
    if (target.health <= 1) {
      handleTargetEliminated(target)
    }
  }

  // Handle target elimination
  const handleTargetEliminated = (target: Target) => {
    setGameState(prev => ({
      ...prev,
      currentPlayer: {
        ...prev.currentPlayer,
        kills: prev.currentPlayer.kills + 1
      }
    }))
    
    // Remove target from detection system
    if (targetDetectionRef.current) {
      targetDetectionRef.current.removeTarget(target.id)
    }
    
    // Play elimination sound
    playEliminationSound()
  }

  // Play elimination sound
  const playEliminationSound = () => {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const audioContext = new AudioContextClass()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.2)
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.4)
    
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.4)
  }

  // Handle player death
  const handlePlayerDeath = () => {
    setGameState(prev => ({
      ...prev,
      currentPlayer: {
        ...prev.currentPlayer,
        deaths: prev.currentPlayer.deaths + 1,
        health: 0
      }
    }))
    
    // Vibrate for death
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100, 50, 100])
    }
    
    // Game over after 3 seconds
    setTimeout(() => {
      setGameState(prev => ({ ...prev, status: 'finished' }))
    }, 3000)
  }

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle game end
  const handleGameEnd = () => {
    stopCamera()
    router.push('/lobby')
  }

  if (gameState.status === 'finished') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Game Over</h1>
          <div className="text-2xl mb-8">
            <p>Kills: {gameState.currentPlayer.kills}</p>
            <p>Deaths: {gameState.currentPlayer.deaths}</p>
          </div>
          <button 
            onClick={handleGameEnd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg"
          >
            Kembali ke Lobby
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Camera Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* AR Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      
      {/* Game UI */}
      <div className="absolute inset-0 z-10">
        {/* Top Bar - Time and Health */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
            <div className="text-2xl font-bold">{formatTime(gameState.timeLeft)}</div>
            <div className="text-sm">Time Remaining</div>
          </div>
          
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
            <div className="text-2xl font-bold text-red-400">
              {'❤️'.repeat(gameState.currentPlayer.health)}
            </div>
            <div className="text-sm">Health</div>
          </div>
          
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
            <div className="text-2xl font-bold text-green-400">
              {gameState.currentPlayer.kills} Kills
            </div>
            <div className="text-sm">Score</div>
          </div>
        </div>
        
        {/* Crosshair */}
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
            borderRadius: '50%'
          }}
        />
        
        {/* Shoot Button */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <button
            onClick={handleShoot}
            disabled={isShooting}
            className={`
              w-24 h-24 rounded-full border-4 border-white/50 
              ${isShooting 
                ? 'bg-red-600 scale-95' 
                : 'bg-red-500 hover:bg-red-600 hover:scale-105'
              }
              transition-all duration-100 ease-out
              shadow-2xl
            `}
          >
            <div className="text-white text-2xl font-bold">🎯</div>
          </button>
        </div>
        
        {/* Player Info */}
        <div className="absolute bottom-8 right-4 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
          <div className="text-lg font-bold">{gameState.currentPlayer.nama}</div>
          <div className="text-sm">
            Team: {gameState.currentPlayer.tim === 'merah' ? '🔴 Merah' : '⚪ Putih'}
          </div>
        </div>
        
                 {/* Targets Count */}
         <div className="absolute top-20 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
           <div className="text-lg font-bold">
             {targetDetectionRef.current ? targetDetectionRef.current.getVisibleTargets().length : 0}
           </div>
           <div className="text-sm">Targets Remaining</div>
         </div>
      </div>
      
      {/* Loading Screen */}
      {!isCameraActive && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-20">
          <div className="text-center text-white">
            <div className="text-4xl mb-4">📷</div>
            <div className="text-xl">Initializing Camera...</div>
            <div className="text-sm mt-2">Please allow camera access</div>
          </div>
        </div>
      )}
    </div>
  )
} 