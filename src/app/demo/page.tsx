'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AdvancedTargetDetection, AdvancedTarget } from '@/lib/advancedTargetDetection'

interface DemoState {
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
  demoMode: boolean
}

export default function DemoPage() {
  const router = useRouter()
  const [demoState, setDemoState] = useState<DemoState>({
    status: 'waiting',
    timeLeft: 300, // 5 menit
    currentPlayer: {
      id: 'demo-player',
      nama: 'Demo Player',
      tim: 'merah',
      health: 3,
      kills: 0,
      deaths: 0
    },
    demoMode: true
  })

  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isShooting, setIsShooting] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const targetDetectionRef = useRef<AdvancedTargetDetection | null>(null)

  // Initialize demo game
  useEffect(() => {
    // Start demo immediately
    setDemoState(prev => ({ ...prev, status: 'playing' }))
    
    // Start game timer
    gameIntervalRef.current = setInterval(() => {
      setDemoState(prev => {
        if (prev.timeLeft <= 1) {
          return { ...prev, status: 'finished', timeLeft: 0 }
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 }
      })
    }, 1000)

    // Simulate player getting hit randomly (for demo purposes)
    const hitInterval = setInterval(() => {
      setDemoState(prev => {
        if (prev.status !== 'playing' || prev.currentPlayer.health <= 0) {
          return prev
        }
        
        // 5% chance to get hit every 10 seconds
        if (Math.random() < 0.05) {
          const newHealth = prev.currentPlayer.health - 1
          
          // Vibration for getting hit
          if ('vibrate' in navigator) {
            navigator.vibrate(150) // Medium vibration for getting hit
          }
          
          if (newHealth <= 0) {
            handlePlayerDeath()
            return { ...prev, currentPlayer: { ...prev.currentPlayer, health: 0 } }
          }
          return { 
            ...prev, 
            currentPlayer: { ...prev.currentPlayer, health: newHealth }
          }
        }
        return prev
      })
    }, 10000) // Check every 10 seconds

    // Initialize camera
    initializeCamera()

    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current)
      }
      if (hitInterval) {
        clearInterval(hitInterval)
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
            targetDetectionRef.current = new AdvancedTargetDetection(videoRef.current, canvasRef.current)
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
    
    // Add shooting vibration
    if ('vibrate' in navigator) {
      navigator.vibrate(50) // Light vibration for shooting
    }
    
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
  const handleTargetHit = (target: AdvancedTarget) => {
    // Vibrate device - short vibration for hit
    if ('vibrate' in navigator) {
      navigator.vibrate(100) // Short vibration for hit
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
  const handleTargetEliminated = (target: AdvancedTarget) => {
    setDemoState(prev => ({
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
    
    // Strong vibration for elimination
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]) // Pattern vibration for elimination
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

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle player death (when health reaches 0)
  const handlePlayerDeath = () => {
    setDemoState(prev => ({
      ...prev,
      currentPlayer: {
        ...prev.currentPlayer,
        deaths: prev.currentPlayer.deaths + 1,
        health: 0
      }
    }))
    
    // Death vibration pattern
    if ('vibrate' in navigator) {
      navigator.vibrate([300, 200, 300, 200, 300]) // Strong death vibration
    }
    
    // Game over after 3 seconds
    setTimeout(() => {
      setDemoState(prev => ({ ...prev, status: 'finished' }))
    }, 3000)
  }

  // Handle demo end
  const handleDemoEnd = () => {
    stopCamera()
    router.push('/')
  }

  if (demoState.status === 'finished') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Demo Selesai</h1>
          <div className="text-2xl mb-8">
            <p>Kills: {demoState.currentPlayer.kills}</p>
            <p>Deaths: {demoState.currentPlayer.deaths}</p>
          </div>
          <div className="text-lg text-gray-300 mb-8">
            <p>Ini adalah demo game Airsoft AR Battle</p>
            <p>Untuk bermain dengan pemain lain, join lobby!</p>
          </div>
          <div className="space-y-4">
            <button 
              onClick={handleDemoEnd}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg mr-4"
            >
              Kembali ke Home
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-lg"
            >
              Main Lagi
            </button>
          </div>
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
      
      {/* Demo Badge */}
      <div className="absolute top-4 left-4 z-20">
        <div className="bg-yellow-500/80 backdrop-blur-sm rounded-lg px-3 py-1 text-black font-bold text-sm">
          🎮 DEMO MODE
        </div>
      </div>
      
      {/* Game UI */}
      <div className="absolute inset-0 z-10">
        {/* Top Bar - Time and Health */}
        <div className="absolute top-4 left-20 right-4 flex justify-between items-center">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
            <div className="text-2xl font-bold">{formatTime(demoState.timeLeft)}</div>
            <div className="text-sm">Time Remaining</div>
          </div>
          
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
            <div className="text-2xl font-bold text-red-400">
              {'❤️'.repeat(demoState.currentPlayer.health)}
            </div>
            <div className="text-sm">Health</div>
          </div>
          
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
            <div className="text-2xl font-bold text-green-400">
              {demoState.currentPlayer.kills} Kills
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
          <div className="text-lg font-bold">{demoState.currentPlayer.nama}</div>
          <div className="text-sm">
            Team: {demoState.currentPlayer.tim === 'merah' ? '🔴 Merah' : '⚪ Putih'}
          </div>
        </div>
        
        {/* Targets Info */}
        <div className="absolute top-20 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
          <div className="text-lg font-bold">
            {targetDetectionRef.current ? targetDetectionRef.current.getVisibleTargets().length : 0}
          </div>
          <div className="text-sm">Targets in Range</div>
          <div className="text-xs text-gray-300 mt-1">
            Max Range: 500m
          </div>
        </div>

        {/* Demo Info */}
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
          <div className="text-sm text-yellow-400 font-bold">🎮 Demo Mode</div>
          <div className="text-xs text-gray-300">
            Test fitur AR dan target detection
          </div>
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