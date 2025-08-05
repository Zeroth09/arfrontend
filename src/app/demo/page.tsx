'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

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
    timeLeft: 300, // 5 menit
    players: [],
    winner: null,
    gameTime: 0,
    currentPlayer: null,
    crosshairPosition: { x: 0, y: 0 },
    isAiming: false,
    weaponAmmo: 30,
    maxAmmo: 30
  })

  // Calculate center position for crosshair
  const [screenCenter, setScreenCenter] = useState({ x: 0, y: 0 })

  const [cameraView, setCameraView] = useState<'overview' | 'player1' | 'player2'>('overview')
  const [gpsData, setGpsData] = useState<GPSData | null>(null)
  const [isGPSEnabled, setIsGPSEnabled] = useState(false)
  const [humanDetection, setHumanDetection] = useState<{ x: number; y: number; confidence: number }[]>([])
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Initialize demo players with GPS coordinates
  useEffect(() => {
    const demoPlayers: Player[] = [
      {
        id: 'player1',
        nama: 'Player 1 (Merah)',
        tim: 'merah',
        isAlive: true,
        health: 100,
        kills: 0,
        deaths: 0,
        position: { x: 100, y: 100 },
        gps: { lat: -6.2088, lng: 106.8456 }, // Jakarta coordinates
        lastSeen: new Date(),
        isVisible: true
      },
      {
        id: 'player2',
        nama: 'Player 2 (Putih)',
        tim: 'putih',
        isAlive: true,
        health: 100,
        kills: 0,
        deaths: 0,
        position: { x: 400, y: 300 },
        gps: { lat: -6.2089, lng: 106.8457 }, // Slightly different coordinates
        lastSeen: new Date(),
        isVisible: true
      }
    ]

    setGameState(prev => ({
      ...prev,
      players: demoPlayers,
      currentPlayer: 'player1' // Default to player 1
    }))
  }, [])

  // GPS Location tracking
  const enableGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const gpsData: GPSData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          }
          setGpsData(gpsData)
          setIsGPSEnabled(true)
          console.log('GPS enabled:', gpsData)
        },
        (error) => {
          console.error('GPS error:', error)
          // Fallback to demo GPS data
          setGpsData({
            lat: -6.2088,
            lng: 106.8456,
            accuracy: 10,
            timestamp: Date.now()
          })
          setIsGPSEnabled(true)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      )
    } else {
      console.log('GPS not available, using demo data')
      setGpsData({
        lat: -6.2088,
        lng: 106.8456,
        accuracy: 10,
        timestamp: Date.now()
      })
      setIsGPSEnabled(true)
    }
  }

  // Camera access for AR
  const enableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      
      // Start human detection simulation
      startHumanDetection()
    } catch (error) {
      console.error('Camera access error:', error)
      // Fallback to demo camera view
    }
  }

  // Simulate human detection and target movement
  const startHumanDetection = () => {
    setInterval(() => {
      // Simulate human detection with random positions
      const detections = [
        { x: Math.random() * 640, y: Math.random() * 480, confidence: 0.8 + Math.random() * 0.2 },
        { x: Math.random() * 640, y: Math.random() * 480, confidence: 0.7 + Math.random() * 0.3 }
      ]
      setHumanDetection(detections)
    }, 1000)

    // Simulate target movement (camera movement effect)
    setInterval(() => {
      setGameState(prev => ({
        ...prev,
        players: prev.players.map(player => ({
          ...player,
          position: {
            x: Math.random() * 600 + 50, // Random position within screen bounds
            y: Math.random() * 300 + 50
          }
        }))
      }))
    }, 3000) // Move targets every 3 seconds
  }

  // Calculate screen center for crosshair
  const calculateScreenCenter = (element: HTMLDivElement) => {
    const rect = element.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    setScreenCenter({ x: centerX, y: centerY })
    setGameState(prev => ({
      ...prev,
      crosshairPosition: { x: centerX, y: centerY }
    }))
  }

  // Handle shooting
  const handleShoot = () => {
    if (gameState.weaponAmmo <= 0) {
      console.log('Out of ammo!')
      return
    }

    setGameState(prev => ({
      ...prev,
      weaponAmmo: prev.weaponAmmo - 1
    }))

    // Check if any target is in crosshair (center screen)
    const targetPlayer = gameState.players.find(p => p.id !== gameState.currentPlayer && p.isAlive)
    if (targetPlayer) {
      // Calculate distance from screen center to target
      const targetX = targetPlayer.position.x
      const targetY = targetPlayer.position.y
      const centerX = screenCenter.x
      const centerY = screenCenter.y
      
      const distance = Math.sqrt(
        Math.pow(centerX - targetX, 2) + Math.pow(centerY - targetY, 2)
      )
      
      // Hit if target is within 100px of screen center (more realistic for AR)
      if (distance < 100) {
        simulateKill(gameState.currentPlayer!, targetPlayer.id)
        console.log('Target hit! Distance:', distance.toFixed(1), 'px')
      } else {
        console.log('Miss! Distance:', distance.toFixed(1), 'px')
      }
    }
  }

  // Game timer
  useEffect(() => {
    if (gameState.status === 'playing') {
      const timer = setInterval(() => {
        setGameState(prev => {
          const newTimeLeft = prev.timeLeft - 1
          const newGameTime = prev.gameTime + 1

          if (newTimeLeft <= 0) {
            const merahAlive = prev.players.filter(p => p.tim === 'merah' && p.isAlive).length
            const putihAlive = prev.players.filter(p => p.tim === 'putih' && p.isAlive).length
            const winner = merahAlive > putihAlive ? 'merah' : 'putih'
            
            return {
              ...prev,
              status: 'finished',
              timeLeft: 0,
              winner,
              gameTime: newGameTime
            }
          }

          return {
            ...prev,
            timeLeft: newTimeLeft,
            gameTime: newGameTime
          }
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [gameState.status])

  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      status: 'countdown'
    }))

    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        status: 'playing'
      }))
    }, 3000)
  }

  const resetGame = () => {
    setGameState({
      status: 'waiting',
      timeLeft: 300,
      players: [
        {
          id: 'player1',
          nama: 'Player 1 (Merah)',
          tim: 'merah',
          isAlive: true,
          health: 100,
          kills: 0,
          deaths: 0,
          position: { x: 100, y: 100 },
          gps: { lat: -6.2088, lng: 106.8456 },
          lastSeen: new Date(),
          isVisible: true
        },
        {
          id: 'player2',
          nama: 'Player 2 (Putih)',
          tim: 'putih',
          isAlive: true,
          health: 100,
          kills: 0,
          deaths: 0,
          position: { x: 400, y: 300 },
          gps: { lat: -6.2089, lng: 106.8457 },
          lastSeen: new Date(),
          isVisible: true
        }
      ],
      winner: null,
      gameTime: 0,
      currentPlayer: 'player1',
      crosshairPosition: { x: 0, y: 0 },
      isAiming: false,
      weaponAmmo: 30,
      maxAmmo: 30
    })
  }

  const simulateKill = (killerId: string, victimId: string) => {
    setGameState(prev => {
      const updatedPlayers = prev.players.map(player => {
        if (player.id === killerId) {
          return { ...player, kills: player.kills + 1 }
        }
        if (player.id === victimId) {
          return { 
            ...player, 
            isAlive: false, 
            deaths: player.deaths + 1,
            health: 0
          }
        }
        return player
      })

      const merahAlive = updatedPlayers.filter(p => p.tim === 'merah' && p.isAlive).length
      const putihAlive = updatedPlayers.filter(p => p.tim === 'putih' && p.isAlive).length

      if (merahAlive === 0 || putihAlive === 0) {
        const winner = merahAlive === 0 ? 'putih' : 'merah'
        return {
          ...prev,
          players: updatedPlayers,
          status: 'finished',
          winner
        }
      }

      return {
        ...prev,
        players: updatedPlayers
      }
    })
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
    return R * c * 1000 // Convert to meters
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="text-white hover:text-blue-400 transition-colors">
            ← Kembali ke Home
          </Link>
          <h1 className="text-3xl font-bold text-glow">AR Airsoft Demo</h1>
          <div className="text-white text-sm">
            GPS + Camera + Human Detection
          </div>
        </div>

        {/* Game Status */}
        <div className="card mb-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              {gameState.status === 'waiting' && 'Menunggu Game Dimulai...'}
              {gameState.status === 'countdown' && 'Game Akan Dimulai...'}
              {gameState.status === 'playing' && 'AR Battle Sedang Berlangsung'}
              {gameState.status === 'finished' && 'Game Selesai'}
            </h2>

            {gameState.status === 'countdown' && (
              <div className="text-4xl font-bold text-yellow-400 animate-pulse">
                Game akan dimulai dalam 3 detik...
              </div>
            )}

            {gameState.status === 'playing' && (
              <div className="text-3xl font-bold text-green-400">
                ⏱️ {formatTime(gameState.timeLeft)}
              </div>
            )}

            {gameState.status === 'finished' && (
              <div className="text-3xl font-bold text-yellow-400">
                🏆 Tim {gameState.winner === 'merah' ? 'Merah' : 'Putih'} Menang!
              </div>
            )}
          </div>
        </div>

        {/* AR Camera View */}
        <div className="card mb-6">
          <h3 className="text-xl font-bold text-white mb-4">📱 AR Camera View</h3>
          
          <div 
            ref={(element) => {
              if (element) {
                calculateScreenCenter(element)
              }
            }}
            className="relative bg-black rounded-lg overflow-hidden"
          >
            {/* Camera Feed */}
            <video
              ref={videoRef}
              className="w-full h-96 object-cover"
              autoPlay
              muted
              playsInline
            />
            
            {/* Canvas for AR overlays */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-96"
              style={{ pointerEvents: 'none' }}
            />

            {/* Crosshair */}
            <div
              className="absolute w-8 h-8 pointer-events-none z-10"
              style={{
                left: gameState.crosshairPosition.x - 16,
                top: gameState.crosshairPosition.y - 16,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="w-8 h-8 border-2 border-red-500 rounded-full flex items-center justify-center bg-black/20">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
              {/* Crosshair lines */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-0.5 bg-red-500"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-0.5 bg-red-500"></div>
              </div>
            </div>

            {/* Human Detection Boxes */}
            {humanDetection.map((detection, index) => (
              <div
                key={index}
                className="absolute border-2 border-green-500 bg-green-500/20"
                style={{
                  left: detection.x - 25,
                  top: detection.y - 25,
                  width: 50,
                  height: 50
                }}
              >
                <div className="text-green-500 text-xs bg-black/50 px-1">
                  Human {(detection.confidence * 100).toFixed(0)}%
                </div>
              </div>
            ))}

            {/* Target Indicators for Testing */}
            {gameState.players.map((player) => (
              <div
                key={player.id}
                className={`absolute w-16 h-16 rounded-full flex items-center justify-center text-white font-bold border-4 ${
                  player.isAlive
                    ? player.tim === 'merah' ? 'border-red-500 bg-red-500/50' : 'border-white bg-white/50 text-gray-900'
                    : 'border-gray-500 bg-gray-500/50'
                }`}
                style={{
                  left: player.position.x - 32,
                  top: player.position.y - 32
                }}
              >
                {player.id === 'player1' ? 'P1' : 'P2'}
              </div>
            ))}

            {/* Controls Overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between">
              <button
                onClick={handleShoot}
                disabled={gameState.weaponAmmo <= 0}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                🔫 Shoot ({gameState.weaponAmmo}/{gameState.maxAmmo})
              </button>
              
              <button
                onClick={reloadWeapon}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                🔄 Reload
              </button>
            </div>

            {/* Crosshair Position Info */}
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
              🎯 Crosshair: Center Screen
            </div>
          </div>

          {/* Camera Controls */}
          <div className="mt-4 flex space-x-4">
            <button
              onClick={enableCamera}
              className="btn-primary"
            >
              📷 Enable Camera
            </button>
            
            <button
              onClick={enableGPS}
              className="btn-secondary"
            >
              📍 Enable GPS
            </button>
          </div>
        </div>

        {/* GPS and Location Data */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <h3 className="text-xl font-bold text-white mb-4">📍 GPS Data</h3>
            {gpsData ? (
              <div className="space-y-2 text-gray-300">
                <div>Latitude: {gpsData.lat.toFixed(6)}</div>
                <div>Longitude: {gpsData.lng.toFixed(6)}</div>
                <div>Accuracy: {gpsData.accuracy.toFixed(1)}m</div>
                <div>Status: {isGPSEnabled ? '✅ Active' : '❌ Inactive'}</div>
              </div>
            ) : (
              <div className="text-gray-400">GPS not enabled</div>
            )}
          </div>

          <div className="card">
            <h3 className="text-xl font-bold text-white mb-4">🎯 Target Distance</h3>
            {gpsData && gameState.players.length > 0 ? (
              <div className="space-y-2 text-gray-300">
                {gameState.players
                  .filter(p => p.id !== gameState.currentPlayer)
                  .map(player => {
                    const distance = calculateDistance(
                      gpsData.lat, gpsData.lng,
                      player.gps.lat, player.gps.lng
                    )
                    return (
                      <div key={player.id}>
                        {player.nama}: {distance.toFixed(1)}m
                      </div>
                    )
                  })}
              </div>
            ) : (
              <div className="text-gray-400">No GPS data</div>
            )}
          </div>
        </div>

        {/* Game Controls */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <h3 className="text-xl font-bold text-white mb-4">Game Controls</h3>
            <div className="space-y-4">
              {gameState.status === 'waiting' && (
                <button
                  onClick={startGame}
                  className="w-full btn-primary"
                >
                  🚀 Mulai AR Battle
                </button>
              )}

              {gameState.status === 'playing' && (
                <div className="space-y-2">
                  <button
                    onClick={() => simulateKill('player1', 'player2')}
                    className="w-full btn-danger"
                  >
                    💀 Player 1 Eliminasi Player 2
                  </button>
                  <button
                    onClick={() => simulateKill('player2', 'player1')}
                    className="w-full btn-danger"
                  >
                    💀 Player 2 Eliminasi Player 1
                  </button>
                </div>
              )}

              {gameState.status === 'finished' && (
                <button
                  onClick={resetGame}
                  className="w-full btn-secondary"
                >
                  🔄 Reset Game
                </button>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="text-xl font-bold text-white mb-4">Player Selection</h3>
            <div className="space-y-2">
              <button
                onClick={() => setGameState(prev => ({ ...prev, currentPlayer: 'player1' }))}
                className={`w-full p-3 rounded-lg transition-colors ${
                  gameState.currentPlayer === 'player1'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                🎮 Player 1 (Merah)
              </button>
              <button
                onClick={() => setGameState(prev => ({ ...prev, currentPlayer: 'player2' }))}
                className={`w-full p-3 rounded-lg transition-colors ${
                  gameState.currentPlayer === 'player2'
                    ? 'bg-white text-gray-900'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                🎮 Player 2 (Putih)
              </button>
            </div>
          </div>
        </div>

        {/* Player Stats */}
        <div className="grid md:grid-cols-2 gap-6">
          {gameState.players.map((player) => (
            <div key={player.id} className="card">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                {player.tim === 'merah' ? '🔴' : '⚪'} {player.nama}
                {!player.isAlive && <span className="ml-2 text-red-400">💀 ELIMINATED</span>}
                {player.id === gameState.currentPlayer && <span className="ml-2 text-blue-400">🎯 YOU</span>}
              </h3>

              <div className="space-y-3">
                {/* Health Bar */}
                <div>
                  <div className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>Health</span>
                    <span>{player.health}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        player.health > 50 ? 'bg-green-500' : player.health > 25 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${player.health}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{player.kills}</div>
                    <div className="text-gray-400">Kills</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{player.deaths}</div>
                    <div className="text-gray-400">Deaths</div>
                  </div>
                </div>

                {/* GPS Coordinates */}
                <div className="text-xs text-gray-400">
                  <div>GPS: {player.gps.lat.toFixed(6)}, {player.gps.lng.toFixed(6)}</div>
                  <div>Last Seen: {player.lastSeen.toLocaleTimeString()}</div>
                </div>

                {/* Status */}
                <div className="text-center">
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    player.isAlive
                      ? 'bg-green-500/20 text-green-400 border border-green-500'
                      : 'bg-red-500/20 text-red-400 border border-red-500'
                  }`}>
                    {player.isAlive ? '🟢 ALIVE' : '🔴 ELIMINATED'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* AR Game Info */}
        <div className="card mt-6">
          <h3 className="text-xl font-bold text-white mb-4">📋 AR Game Features</h3>
          <div className="grid md:grid-cols-3 gap-4 text-gray-300">
            <div>
              <h4 className="font-bold text-white mb-2">🎯 Crosshair Targeting</h4>
              <p className="text-sm">Real-time crosshair untuk targeting lawan</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">📍 GPS Tracking</h4>
              <p className="text-sm">GPS coordinates untuk positioning</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">👤 Human Detection</h4>
              <p className="text-sm">AI detection untuk identify targets</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 