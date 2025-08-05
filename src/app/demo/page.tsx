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

  const [gpsData, setGpsData] = useState<GPSData | null>(null)
  const [isGPSEnabled, setIsGPSEnabled] = useState(false)
  const [humanDetection, setHumanDetection] = useState<{ x: number; y: number; confidence: number }[]>([])
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Initialize demo players
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
    ]

    setGameState(prev => ({
      ...prev,
      players: demoPlayers,
      currentPlayer: 'player1'
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

  const handleShoot = () => {
    if (gameState.weaponAmmo > 0) {
      setGameState(prev => ({
        ...prev,
        weaponAmmo: prev.weaponAmmo - 1
      }))

      // Simulate shot
      console.log('🔫 Shot fired!')
      
      // Check if any player is hit (simple collision detection)
      const crosshair = gameState.crosshairPosition
      const hitPlayer = gameState.players.find(player => {
        const distance = Math.sqrt(
          Math.pow(player.position.x - crosshair.x, 2) + 
          Math.pow(player.position.y - crosshair.y, 2)
        )
        return distance < 50 && player.isAlive // Hit if within 50px
      })

      if (hitPlayer) {
        console.log(`🎯 Hit ${hitPlayer.nama}!`)
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => {
            if (p.id === hitPlayer.id) {
              const newHealth = Math.max(0, p.health - 25)
              return {
                ...p,
                health: newHealth,
                isAlive: newHealth > 0,
                deaths: newHealth === 0 ? p.deaths + 1 : p.deaths
              }
            }
            return p
          })
        }))
      }
    }
  }

  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      status: 'playing',
      gameTime: Date.now()
    }))
  }

  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      status: 'waiting',
      timeLeft: 300,
      players: prev.players.map(p => ({
        ...p,
        health: 100,
        kills: 0,
        deaths: 0,
        isAlive: true
      })),
      winner: null,
      gameTime: 0,
      weaponAmmo: 30
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-white hover:text-blue-400 transition-colors">
            ← Kembali ke Home
          </Link>
          <h1 className="text-3xl font-bold text-glow">Demo AR Battle</h1>
          <div className="text-white">
            <span className="mr-4">Ammo: {gameState.weaponAmmo}/{gameState.maxAmmo}</span>
            <button 
              onClick={reloadWeapon}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
            >
              Reload
            </button>
          </div>
        </div>

        {/* Game Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Status Game</h3>
            <p className="text-gray-300">Status: {gameState.status}</p>
            <p className="text-gray-300">Waktu: {formatTime(gameState.timeLeft)}</p>
            <p className="text-gray-300">Pemain: {gameState.players.length}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">GPS Tracking</h3>
            {gpsData ? (
              <div>
                <p className="text-gray-300">Lat: {gpsData.lat.toFixed(6)}</p>
                <p className="text-gray-300">Lng: {gpsData.lng.toFixed(6)}</p>
                <p className="text-gray-300">Accuracy: {gpsData.accuracy}m</p>
              </div>
            ) : (
              <p className="text-gray-400">GPS belum aktif</p>
            )}
            <button 
              onClick={enableGPS}
              className="mt-2 bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
            >
              Enable GPS
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Camera AR</h3>
            <button 
              onClick={enableCamera}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
            >
              Enable Camera
            </button>
          </div>
        </div>

        {/* Game Controls */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={startGame}
            disabled={gameState.status === 'playing'}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold"
          >
            Start Game
          </button>
          <button 
            onClick={resetGame}
            className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-lg font-semibold"
          >
            Reset Game
          </button>
        </div>

        {/* Game Area */}
        <div className="relative bg-black rounded-lg overflow-hidden" style={{ height: '500px' }}>
          {/* Video Background */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            autoPlay
            muted
            playsInline
          />
          
          {/* Canvas Overlay */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ zIndex: 10 }}
          />

          {/* Crosshair */}
          <div 
            className="absolute w-8 h-8 border-2 border-red-500 rounded-full pointer-events-none"
            style={{
              left: gameState.crosshairPosition.x - 16,
              top: gameState.crosshairPosition.y - 16,
              zIndex: 20
            }}
          />

          {/* Players */}
          {gameState.players.map(player => (
            <div
              key={player.id}
              className={`absolute w-6 h-6 rounded-full border-2 ${
                player.tim === 'merah' ? 'bg-red-500 border-red-300' : 'bg-white border-gray-300'
              } ${!player.isAlive ? 'opacity-50' : ''}`}
              style={{
                left: player.position.x,
                top: player.position.y,
                zIndex: 15
              }}
              title={`${player.nama} - HP: ${player.health}`}
            />
          ))}

          {/* Human Detection Markers */}
          {humanDetection.map((detection, index) => (
            <div
              key={index}
              className="absolute w-4 h-4 bg-yellow-400 rounded-full border border-yellow-600"
              style={{
                left: detection.x,
                top: detection.y,
                zIndex: 25
              }}
              title={`Human detected (${(detection.confidence * 100).toFixed(1)}%)`}
            />
          ))}

          {/* Shoot Button */}
          <button
            onClick={handleShoot}
            disabled={gameState.weaponAmmo === 0}
            className="absolute bottom-4 right-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 w-16 h-16 rounded-full text-white font-bold text-xl"
            style={{ zIndex: 30 }}
          >
            🔫
          </button>
        </div>

        {/* Player List */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Tim Merah</h3>
            {gameState.players.filter(p => p.tim === 'merah').map(player => (
              <div key={player.id} className="flex justify-between items-center mb-2 p-2 bg-red-900 rounded">
                <span className="text-white">{player.nama}</span>
                <div className="text-sm text-gray-300">
                  <span className="mr-2">HP: {player.health}</span>
                  <span className="mr-2">Kills: {player.kills}</span>
                  <span>Deaths: {player.deaths}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Tim Putih</h3>
            {gameState.players.filter(p => p.tim === 'putih').map(player => (
              <div key={player.id} className="flex justify-between items-center mb-2 p-2 bg-gray-700 rounded">
                <span className="text-white">{player.nama}</span>
                <div className="text-sm text-gray-300">
                  <span className="mr-2">HP: {player.health}</span>
                  <span className="mr-2">Kills: {player.kills}</span>
                  <span>Deaths: {player.deaths}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 