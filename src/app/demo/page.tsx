'use client'

import { useState, useEffect, useRef } from 'react'
import { MultiplayerWebSocket } from '@/lib/websocket'

interface Player {
  id: string
  nama: string
  tim: 'merah' | 'putih'
  isAlive: boolean
  health: number
  kills: number
  deaths: number
  position: { x: number; y: number }
  gps: { lat: number; lng: number }
  lastSeen: Date
  isVisible: boolean
}

interface GameState {
  status: 'waiting' | 'countdown' | 'playing' | 'finished'
  timeLeft: number
  players: Player[]
  winner: 'merah' | 'putih' | null
  gameTime: number
  currentPlayer: string | null
  crosshairPosition: { x: number; y: number }
  isAiming: boolean
  weaponAmmo: number
  maxAmmo: number
  recoilOffset: { x: number; y: number }
  isRecoiling: boolean
  gyroEnabled: boolean
  gyroOffset: { x: number; y: number }
}

interface GPSData {
  lat: number
  lng: number
  accuracy: number
  timestamp: number
}

export default function DemoPage() {
  const [gameState, setGameState] = useState<GameState>({
    status: 'waiting',
    timeLeft: 300, // 5 minutes
    players: [],
    winner: null,
    gameTime: 0,
    currentPlayer: null,
    crosshairPosition: { x: 0, y: 0 },
    isAiming: false,
    weaponAmmo: 30,
    maxAmmo: 30,
    recoilOffset: { x: 0, y: 0 },
    isRecoiling: false,
    gyroEnabled: false,
    gyroOffset: { x: 0, y: 0 }
  })

  const [isConnected, setIsConnected] = useState(false)
  const [multiplayer, setMultiplayer] = useState<MultiplayerWebSocket | null>(null)
  const [gpsData, setGpsData] = useState<GPSData | null>(null)
  const [cameraView, setCameraView] = useState<HTMLVideoElement | null>(null)
  const [humanDetectionActive, setHumanDetectionActive] = useState(false)
  const [detectedHumans, setDetectedHumans] = useState<Array<{ x: number; y: number; confidence: number }>>([])
  const [otherPlayers, setOtherPlayers] = useState<Player[]>([])

  const gameContainerRef = useRef<HTMLDivElement>(null)
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null)
  const gpsIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const gyroRef = useRef<{ alpha: number; beta: number; gamma: number } | null>(null)

  // Initialize multiplayer connection
  useEffect(() => {
    const playerId = gameState.currentPlayer || 'player1'
    const serverUrl = 'https://shaky-meeting-production.up.railway.app'
    const multiplayer = new MultiplayerWebSocket(serverUrl, playerId, (message) => {
      console.log('Received message:', message)
      // Handle real WebSocket messages here
    })
    
    setMultiplayer(multiplayer)
    multiplayer.connect()
    setIsConnected(true)

    return () => {
      multiplayer.disconnect()
    }
  }, [gameState.currentPlayer])

  // GPS Location tracking
  const enableGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords
          setGpsData({
            lat: latitude,
            lng: longitude,
            accuracy,
            timestamp: Date.now()
          })
          console.log('GPS Location:', { lat: latitude, lng: longitude, accuracy })
        },
        (error) => {
          console.error('GPS Error:', error)
          alert('Gagal mendapatkan lokasi GPS')
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )

      // Start GPS tracking
      gpsIntervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords
            setGpsData({
              lat: latitude,
              lng: longitude,
              accuracy,
              timestamp: Date.now()
            })
          },
          (error) => {
            console.error('GPS Tracking Error:', error)
          }
        )
      }, 5000) // Update every 5 seconds
    } else {
      alert('GPS tidak tersedia di browser ini')
    }
  }

  const disableGPS = () => {
    if (gpsIntervalRef.current) {
      clearInterval(gpsIntervalRef.current)
      gpsIntervalRef.current = null
    }
    setGpsData(null)
  }

  // Camera and AR functionality
  const enableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })

      const video = document.createElement('video')
      video.srcObject = stream
      video.autoplay = true
      video.playsInline = true
      setCameraView(video)

      // Add video to game container
      if (gameContainerRef.current) {
        gameContainerRef.current.appendChild(video)
        video.style.position = 'absolute'
        video.style.top = '0'
        video.style.left = '0'
        video.style.width = '100%'
        video.style.height = '100%'
        video.style.zIndex = '1'
      }
    } catch (error) {
      console.error('Camera Error:', error)
      alert('Gagal mengakses kamera')
    }
  }

  const disableCamera = () => {
    if (cameraView) {
      const stream = cameraView.srcObject as MediaStream
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      cameraView.remove()
      setCameraView(null)
    }
  }

  // Human detection simulation
  const startHumanDetection = () => {
    setHumanDetectionActive(true)
    
    // Simulate human detection every 2 seconds
    const detectionInterval = setInterval(() => {
      if (gameContainerRef.current && humanDetectionActive) {
        const rect = gameContainerRef.current.getBoundingClientRect()
        const detectedHuman = {
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          confidence: Math.random() * 0.5 + 0.5 // 50-100% confidence
        }
        
        setDetectedHumans(prev => [...prev, detectedHuman])
        
        // Remove old detections after 5 seconds
        setTimeout(() => {
          setDetectedHumans(prev => prev.filter(h => h !== detectedHuman))
        }, 5000)
      }
    }, 2000)

    return () => clearInterval(detectionInterval)
  }

  const stopHumanDetection = () => {
    setHumanDetectionActive(false)
    setDetectedHumans([])
  }

  // Crosshair positioning
  const calculateScreenCenter = (element: HTMLDivElement) => {
    const rect = element.getBoundingClientRect()
    return {
      x: rect.width / 2,
      y: rect.height / 2
    }
  }

  // Set crosshair to center on mount and resize
  useEffect(() => {
    if (gameContainerRef.current) {
      const center = calculateScreenCenter(gameContainerRef.current)
      setGameState(prev => ({
        ...prev,
        crosshairPosition: center
      }))
    }
  }, [])

  // Handle window resize to keep crosshair centered
  useEffect(() => {
    const handleResize = () => {
      if (gameContainerRef.current) {
        const center = calculateScreenCenter(gameContainerRef.current)
        setGameState(prev => ({
          ...prev,
          crosshairPosition: center
        }))
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Recoil effect
  const applyRecoil = () => {
    // Random recoil pattern (up and slightly random left/right)
    const recoilX = (Math.random() - 0.5) * 20 // -10 to 10px
    const recoilY = -30 - Math.random() * 20 // -30 to -50px (mostly upward)
    
    setGameState(prev => ({
      ...prev,
      recoilOffset: { x: recoilX, y: recoilY },
      isRecoiling: true
    }))

    // Reset recoil after animation
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        recoilOffset: { x: 0, y: 0 },
        isRecoiling: false
      }))
    }, 200) // 200ms recoil duration
  }

  // Shooting mechanics with recoil
  const handleShoot = () => {
    if (gameState.weaponAmmo > 0 && gameState.status === 'playing' && !gameState.isRecoiling) {
      // Apply recoil effect
      applyRecoil()
      
      setGameState(prev => ({
        ...prev,
        weaponAmmo: prev.weaponAmmo - 1
      }))

      // Send shoot message to server
      if (multiplayer) {
        multiplayer.sendShoot('target', gameState.crosshairPosition)
      }

      // Simulate hit detection with recoil and gyro offset
      const hitTarget = gameState.players.find(player => 
        player.isAlive && 
        Math.abs(player.position.x - (gameState.crosshairPosition.x + gameState.recoilOffset.x + gameState.gyroOffset.x)) < 50 &&
        Math.abs(player.position.y - (gameState.crosshairPosition.y + gameState.recoilOffset.y + gameState.gyroOffset.y)) < 50
      )

      if (hitTarget) {
        console.log(`Hit target: ${hitTarget.nama}`)
        
        // Send hit confirmation
        if (multiplayer) {
          multiplayer.sendHit(hitTarget.id, 25)
        }

        // Update player health
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => 
            p.id === hitTarget.id 
              ? { ...p, health: Math.max(0, p.health - 25) }
              : p
          )
        }))
      }
    }
  }

  // Game controls
  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      status: 'playing',
      timeLeft: 300,
      gameTime: Date.now()
    }))

    // Start game timer
    gameTimerRef.current = setInterval(() => {
      setGameState(prev => {
        const newTimeLeft = prev.timeLeft - 1
        if (newTimeLeft <= 0) {
          clearInterval(gameTimerRef.current!)
          return { ...prev, status: 'finished', timeLeft: 0 }
        }
        return { ...prev, timeLeft: newTimeLeft }
      })
    }, 1000)
  }

  const resetGame = () => {
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current)
    }

    setGameState({
      status: 'waiting',
      timeLeft: 300,
      players: [],
      winner: null,
      gameTime: 0,
      currentPlayer: null,
      crosshairPosition: { x: 0, y: 0 },
      isAiming: false,
      weaponAmmo: 30,
      maxAmmo: 30,
      recoilOffset: { x: 0, y: 0 },
      isRecoiling: false,
      gyroEnabled: false,
      gyroOffset: { x: 0, y: 0 }
    })

    setDetectedHumans([])
    setHumanDetectionActive(false)
  }

  // Mouse/touch controls - REMOVED, crosshair stays centered
  // const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
  //   if (gameContainerRef.current) {
  //     const rect = gameContainerRef.current.getBoundingClientRect()
  //     const x = e.clientX - rect.left
  //     const y = e.clientY - rect.top
  //     
  //     setGameState(prev => ({
  //       ...prev,
  //       crosshairPosition: { x, y }
  //     }))
  //   }
  // }

  // const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
  //   e.preventDefault()
  //   if (gameContainerRef.current && e.touches[0]) {
  //     const rect = gameContainerRef.current.getBoundingClientRect()
  //     const touch = e.touches[0]
  //     const x = touch.clientX - rect.left
  //     const y = touch.clientY - rect.top
  //     
  //     setGameState(prev => ({
  //       ...prev,
  //       crosshairPosition: { x, y }
  //     }))
  //   }
  // }

  const simulateKill = (killerId: string, victimId: string) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => {
        if (p.id === victimId) {
          return { ...p, isAlive: false, health: 0, deaths: p.deaths + 1 }
        }
        if (p.id === killerId) {
          return { ...p, kills: p.kills + 1 }
        }
        return p
      })
    }))
  }

  const reloadWeapon = () => {
    setGameState(prev => ({
      ...prev,
      weaponAmmo: prev.maxAmmo
    }))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Gyro control functions
  const enableGyro = () => {
    if ('DeviceOrientationEvent' in window) {
      // Request permission for iOS
      const DeviceOrientationEventWithPermission = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
        requestPermission?: () => Promise<string>
      }
      
      if (typeof DeviceOrientationEventWithPermission.requestPermission === 'function') {
        DeviceOrientationEventWithPermission.requestPermission()
          .then((permission: string) => {
            if (permission === 'granted') {
              startGyroTracking()
            } else {
              alert('Izin gyro diperlukan untuk kontrol yang lebih baik')
            }
          })
          .catch((error: unknown) => {
            console.error('Gyro permission error:', error)
            alert('Gagal mengaktifkan gyro')
          })
      } else {
        // For Android and other devices
        startGyroTracking()
      }
    } else {
      alert('Gyro tidak tersedia di device ini')
    }
  }

  const disableGyro = () => {
    setGameState(prev => ({
      ...prev,
      gyroEnabled: false,
      gyroOffset: { x: 0, y: 0 }
    }))
    gyroRef.current = null
  }

  const startGyroTracking = () => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      gyroRef.current = {
        alpha: event.alpha || 0,
        beta: event.beta || 0,
        gamma: event.gamma || 0
      }

      if (gameState.gyroEnabled && gameContainerRef.current) {
        const rect = gameContainerRef.current.getBoundingClientRect()
        
        // Convert gyro data to screen coordinates
        // Beta (pitch) controls Y movement, Gamma (roll) controls X movement
        const sensitivity = 2 // Adjust sensitivity
        const maxOffset = Math.min(rect.width, rect.height) * 0.3 // 30% of screen size
        
        const gyroX = Math.max(-maxOffset, Math.min(maxOffset, (event.gamma || 0) * sensitivity))
        const gyroY = Math.max(-maxOffset, Math.min(maxOffset, (event.beta || 0) * sensitivity))
        
        setGameState(prev => ({
          ...prev,
          gyroOffset: { x: gyroX, y: gyroY }
        }))
      }
    }

    window.addEventListener('deviceorientation', handleOrientation)
    
    setGameState(prev => ({
      ...prev,
      gyroEnabled: true
    }))

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm p-4 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Airsoft AR Battle</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <div>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
              <div>GPS: {gpsData ? '🟢 Active' : '🔴 Inactive'}</div>
            </div>
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
            >
              Reset Game
            </button>
          </div>
        </div>
      </div>

      {/* Game Container */}
      <div className="relative flex-1">
        <div
          ref={gameContainerRef}
          className="relative w-full h-[calc(100vh-200px)] bg-gray-800 overflow-hidden"
        >
          {/* Muzzle Flash Effect */}
          {gameState.isRecoiling && (
            <div className="absolute w-16 h-16 pointer-events-none z-40"
              style={{
                left: gameState.crosshairPosition.x - 32 + gameState.recoilOffset.x + gameState.gyroOffset.x,
                top: gameState.crosshairPosition.y - 32 + gameState.recoilOffset.y + gameState.gyroOffset.y,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="w-full h-full bg-yellow-400 rounded-full animate-ping opacity-80"></div>
              <div className="absolute inset-0 w-full h-full bg-orange-500 rounded-full animate-pulse"></div>
            </div>
          )}

          {/* Crosshair - Always Centered with Recoil and Gyro Effect */}
          <div
            className={`absolute w-8 h-8 pointer-events-none z-50 transition-transform duration-200 ${
              gameState.isRecoiling ? 'animate-pulse' : ''
            }`}
            style={{
              left: gameState.crosshairPosition.x - 16 + gameState.recoilOffset.x + gameState.gyroOffset.x,
              top: gameState.crosshairPosition.y - 16 + gameState.recoilOffset.y + gameState.gyroOffset.y,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="w-full h-full border-2 border-red-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
            {/* Recoil flash effect */}
            {gameState.isRecoiling && (
              <div className="absolute inset-0 w-full h-full border-4 border-yellow-400 rounded-full animate-ping opacity-75"></div>
            )}
            {/* Gyro indicator */}
            {gameState.gyroEnabled && (
              <div className="absolute -inset-2 w-12 h-12 border-2 border-cyan-400 rounded-full opacity-50 animate-pulse"></div>
            )}
          </div>

          {/* Gyro Status Indicator */}
          {gameState.gyroEnabled && (
            <div className="absolute top-20 left-4 bg-cyan-900/70 text-white px-3 py-2 rounded-lg z-50">
              <div className="text-center">
                <div className="text-lg">📱</div>
                <div className="text-xs">GYRO ACTIVE</div>
                <div className="text-xs">
                  X: {gameState.gyroOffset.x.toFixed(1)} Y: {gameState.gyroOffset.y.toFixed(1)}
                </div>
              </div>
            </div>
          )}

          {/* Human Detection Overlay */}
          {humanDetectionActive && detectedHumans.map((human, index) => (
            <div
              key={index}
              className="absolute w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"
              style={{
                left: human.x - 8,
                top: human.y - 8,
                opacity: human.confidence
              }}
            />
          ))}

          {/* Players */}
          {gameState.players.map((player) => (
            <div
              key={player.id}
              className={`absolute w-6 h-6 rounded-full border-2 ${
                player.tim === 'merah' ? 'bg-red-500 border-red-300' : 'bg-white border-gray-300'
              } ${player.isAlive ? 'opacity-100' : 'opacity-50'}`}
              style={{
                left: player.position.x - 12,
                top: player.position.y - 12
              }}
            >
              <div className="text-xs text-center text-black font-bold">
                {player.health}
              </div>
            </div>
          ))}

          {/* Fire Button - Large and Easy to Access */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
            <button
              onClick={handleShoot}
              disabled={gameState.weaponAmmo <= 0 || gameState.status !== 'playing' || gameState.isRecoiling}
              className={`
                w-24 h-24 rounded-full border-4 font-bold text-white text-lg
                transition-all duration-200 transform hover:scale-110 active:scale-95
                ${gameState.isRecoiling 
                  ? 'bg-orange-600 border-orange-400 animate-pulse cursor-not-allowed'
                  : gameState.weaponAmmo > 0 && gameState.status === 'playing'
                    ? 'bg-red-600 hover:bg-red-700 border-red-400 shadow-lg shadow-red-500/50'
                    : 'bg-gray-600 border-gray-400 cursor-not-allowed'
                }
              `}
            >
              {gameState.isRecoiling ? '💥 RECOIL' : '🔫 FIRE'}
            </button>
          </div>

          {/* Ammo Counter */}
          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg z-50">
            <div className="text-center">
              <div className="text-2xl font-bold">{gameState.weaponAmmo}</div>
              <div className="text-xs">AMMO</div>
            </div>
          </div>

          {/* Game Status */}
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg z-50">
            <div className="text-center">
              <div className="text-lg font-bold">{formatTime(gameState.timeLeft)}</div>
              <div className="text-xs">{gameState.status.toUpperCase()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black/50 backdrop-blur-sm p-4 border-t border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={enableGPS}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Enable GPS
          </button>
          <button
            onClick={disableGPS}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
          >
            Disable GPS
          </button>
          <button
            onClick={enableCamera}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
          >
            Enable Camera
          </button>
          <button
            onClick={disableCamera}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
          >
            Disable Camera
          </button>
          <button
            onClick={startHumanDetection}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
          >
            Start Detection
          </button>
          <button
            onClick={stopHumanDetection}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
          >
            Stop Detection
          </button>
          <button
            onClick={startGame}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
          >
            Start Game
          </button>
          <button
            onClick={reloadWeapon}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg"
          >
            Reload Weapon
          </button>
          <button
            onClick={enableGyro}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg"
          >
            Enable Gyro
          </button>
          <button
            onClick={disableGyro}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
          >
            Disable Gyro
          </button>
        </div>

        {/* GPS Info */}
        {gpsData && (
          <div className="mt-4 p-3 bg-blue-900/50 rounded-lg">
            <h3 className="font-bold mb-2">GPS Data:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Latitude: {gpsData.lat.toFixed(6)}</div>
              <div>Longitude: {gpsData.lng.toFixed(6)}</div>
              <div>Accuracy: {gpsData.accuracy.toFixed(1)}m</div>
              <div>Timestamp: {gpsData.timestamp ? new Date(gpsData.timestamp).toLocaleTimeString() : 'N/A'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 