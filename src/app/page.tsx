'use client'

import React, { useState, useEffect, useRef } from 'react'

interface Target {
  id: string
  type: 'human' | 'enemy'
  name: string
  distance: number
  position: { x: number; y: number }
  health: number
}

interface GameState {
  isLoading: boolean
  showMenu: boolean
  showGame: boolean
  ammo: number
  maxAmmo: number
  accuracy: number
  selectedTarget: Target | null
  targets: Target[]
  gameTime: number
  gpsStatus: 'connecting' | 'connected' | 'error'
  gpsCoords: { lat: number; lng: number } | null
}

export default function HomePage() {
  const [gameState, setGameState] = useState<GameState>({
    isLoading: true,
    showMenu: false,
    showGame: false,
    ammo: 30,
    maxAmmo: 30,
    accuracy: 85,
    selectedTarget: null,
    targets: [],
    gameTime: 300, // 5 minutes
    gpsStatus: 'connecting',
    gpsCoords: null
  })

  const videoRef = useRef<HTMLVideoElement>(null)
  const gpsWatchId = useRef<number | null>(null)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setGameState(prev => ({ ...prev, isLoading: false, showMenu: true }))
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (gameState.showGame) {
      initializeGPS()
      initializeTargets()
      startGameTimer()
    }

    return () => {
      if (gpsWatchId.current) {
        navigator.geolocation.clearWatch(gpsWatchId.current)
      }
    }
  }, [gameState.showGame])

  const initializeGPS = () => {
    if ('geolocation' in navigator) {
      gpsWatchId.current = navigator.geolocation.watchPosition(
        (position) => {
          setGameState(prev => ({
            ...prev,
            gpsStatus: 'connected',
            gpsCoords: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }))
        },
        (error) => {
          console.error('GPS Error:', error)
          setGameState(prev => ({ ...prev, gpsStatus: 'error' }))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      )
    } else {
      setGameState(prev => ({ ...prev, gpsStatus: 'error' }))
    }
  }

  const initializeTargets = () => {
    const mockTargets: Target[] = [
      {
        id: '1',
        type: 'enemy',
        name: 'Enemy Alpha',
        distance: 25,
        position: { x: 150, y: 200 },
        health: 100
      },
      {
        id: '2',
        type: 'human',
        name: 'Player Beta',
        distance: 45,
        position: { x: 300, y: 150 },
        health: 100
      },
      {
        id: '3',
        type: 'enemy',
        name: 'Enemy Gamma',
        distance: 60,
        position: { x: 400, y: 300 },
        health: 100
      }
    ]
    setGameState(prev => ({ ...prev, targets: mockTargets }))
  }

  const startGameTimer = () => {
    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.gameTime <= 0) {
          clearInterval(timer)
          return { ...prev, showGame: false, showMenu: true }
        }
        return { ...prev, gameTime: prev.gameTime - 1 }
      })
    }, 1000)

    return () => clearInterval(timer)
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Camera access error:', error)
    }
  }

  const handleStartGame = () => {
    setGameState(prev => ({ ...prev, showMenu: false, showGame: true }))
    startCamera()
  }

  const handleGameMaster = () => {
    alert('🎮 Game Master Panel akan dibuka di tab baru')
    window.open('/game-master', '_blank')
  }

  const handleServerStatus = () => {
    alert('📊 Server Status akan dibuka di tab baru')
    window.open('/server-status', '_blank')
  }

  const selectTarget = (target: Target) => {
    setGameState(prev => ({ ...prev, selectedTarget: target }))
  }

  const lockTarget = () => {
    if (gameState.selectedTarget) {
      // Simulate target locking
      console.log('Target locked:', gameState.selectedTarget.name)
    }
  }

  const fireWeapon = () => {
    if (gameState.ammo <= 0) {
      alert('💥 Ammo habis! Reload dulu!')
      return
    }

    if (gameState.selectedTarget) {
      setGameState(prev => ({ ...prev, ammo: prev.ammo - 1 }))
      
      // Simulate hit effect
      const hitEffect = document.createElement('div')
      hitEffect.className = 'hit-effect'
      document.body.appendChild(hitEffect)
      
      setTimeout(() => {
        document.body.removeChild(hitEffect)
      }, 500)

      // Calculate hit probability based on accuracy
      const hitChance = gameState.accuracy / 100
      if (Math.random() < hitChance) {
        alert(`🎯 Hit! ${gameState.selectedTarget.name} terkena!`)
      } else {
        alert('💨 Miss! Coba lagi!')
      }
    } else {
      alert('🎯 Pilih target dulu!')
    }
  }

  const reloadWeapon = () => {
    setGameState(prev => ({ ...prev, ammo: prev.maxAmmo }))
    alert('🔄 Reloaded!')
  }

  const goBack = () => {
    setGameState(prev => ({ ...prev, showGame: false, showMenu: true }))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (gameState.isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <h2 className="text-2xl font-bold text-white">🎮 Loading Airsoft AR Battle...</h2>
        <p className="text-gray-300 mt-2">Memuat game engine dan GPS...</p>
      </div>
    )
  }

  if (gameState.showMenu) {
    return (
      <div className="menu-container">
        <h1 className="menu-title">🎮 Airsoft AR Battle</h1>
        <div className="space-y-4">
          <button 
            className="menu-button"
            onClick={handleStartGame}
          >
            🎯 Start Game
          </button>
          <button 
            className="menu-button"
            onClick={handleGameMaster}
          >
            👑 Game Master
          </button>
          <button 
            className="menu-button"
            onClick={handleServerStatus}
          >
            📊 Server Status
          </button>
        </div>
        <p className="mt-8 text-gray-300 text-sm">
          📱 Mobile Optimized • 📷 Camera Ready • 🎯 GPS Enabled
        </p>
      </div>
    )
  }

  if (gameState.showGame) {
    return (
      <div className="camera-container">
        {/* Camera Feed */}
        <video
          ref={videoRef}
          className="camera-feed"
          autoPlay
          playsInline
          muted
        />
        
        {/* Crosshair */}
        <div className="crosshair"></div>
        
        {/* Status Panel */}
        <div className="status-panel">
          <div className="gps-status">
            <span>📍 GPS:</span>
            <span className={gameState.gpsStatus === 'connected' ? 'text-green-400' : 'text-red-400'}>
              {gameState.gpsStatus === 'connected' ? 'Connected' : 
               gameState.gpsStatus === 'connecting' ? 'Connecting...' : 'Error'}
            </span>
          </div>
          <div>⏱️ {formatTime(gameState.gameTime)}</div>
          <div>❤️ HP: 100</div>
        </div>
        
        {/* Back Button */}
        <button className="back-button" onClick={goBack}>
          ← Back
        </button>
        
        {/* Ammo Display */}
        <div className="ammo-display">
          <div className="text-lg font-bold">💥 {gameState.ammo}/{gameState.maxAmmo}</div>
          <button 
            className="text-sm bg-blue-600 px-2 py-1 rounded mt-1"
            onClick={reloadWeapon}
          >
            🔄 Reload
          </button>
        </div>
        
        {/* Target Info */}
        {gameState.selectedTarget && (
          <div className="target-info">
            <div className="font-bold">{gameState.selectedTarget.name}</div>
            <div>Distance: {gameState.selectedTarget.distance}m</div>
            <div>Health: {gameState.selectedTarget.health}%</div>
            <div>Type: {gameState.selectedTarget.type}</div>
          </div>
        )}
        
        {/* Accuracy Meter */}
        <div className="accuracy-meter">
          <div 
            className="accuracy-fill"
            style={{ width: `${gameState.accuracy}%` }}
          ></div>
        </div>
        
        {/* Game Controls */}
        <button className="lock-button" onClick={lockTarget}>
          🔒 Lock
        </button>
        <button className="fire-button" onClick={fireWeapon}>
          🔫 Fire
        </button>
        
        {/* Target Markers */}
        {gameState.targets.map((target) => (
          <div
            key={target.id}
            className="target-marker"
            style={{
              left: target.position.x,
              top: target.position.y,
              cursor: 'pointer'
            }}
            onClick={() => selectTarget(target)}
          >
            <div className="text-xs text-center mt-2">
              {target.name}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return null
} 