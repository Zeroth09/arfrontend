'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Player {
  id: string
  nama: string
  health: number
  ammo: number
  position: { x: number; y: number }
  team: 'merah' | 'putih'
  isAlive: boolean
  kills: number
  deaths: number
}

interface GameState {
  status: 'playing' | 'finished'
  timeLeft: number
  score: { merah: number; putih: number }
  players: Player[]
  winner: 'merah' | 'putih' | null
}

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState>({
    status: 'playing',
    timeLeft: 300, // 5 menit
    score: { merah: 5, putih: 5 }, // Alive players
    players: [
      // Tim Merah
      {
        id: '1',
        nama: 'Player1',
        health: 100,
        ammo: 30,
        position: { x: 50, y: 50 },
        team: 'merah',
        isAlive: true,
        kills: 0,
        deaths: 0
      },
      {
        id: '2',
        nama: 'Player2',
        health: 100,
        ammo: 30,
        position: { x: 100, y: 50 },
        team: 'merah',
        isAlive: true,
        kills: 0,
        deaths: 0
      },
      {
        id: '3',
        nama: 'Player3',
        health: 100,
        ammo: 30,
        position: { x: 150, y: 50 },
        team: 'merah',
        isAlive: true,
        kills: 0,
        deaths: 0
      },
      {
        id: '4',
        nama: 'Player4',
        health: 100,
        ammo: 30,
        position: { x: 200, y: 50 },
        team: 'merah',
        isAlive: true,
        kills: 0,
        deaths: 0
      },
      {
        id: '5',
        nama: 'Player5',
        health: 100,
        ammo: 30,
        position: { x: 250, y: 50 },
        team: 'merah',
        isAlive: true,
        kills: 0,
        deaths: 0
      },
      // Tim Putih
      {
        id: '6',
        nama: 'Player6',
        health: 100,
        ammo: 30,
        position: { x: 50, y: 200 },
        team: 'putih',
        isAlive: true,
        kills: 0,
        deaths: 0
      },
      {
        id: '7',
        nama: 'Player7',
        health: 100,
        ammo: 30,
        position: { x: 100, y: 200 },
        team: 'putih',
        isAlive: true,
        kills: 0,
        deaths: 0
      },
      {
        id: '8',
        nama: 'Player8',
        health: 100,
        ammo: 30,
        position: { x: 150, y: 200 },
        team: 'putih',
        isAlive: true,
        kills: 0,
        deaths: 0
      },
      {
        id: '9',
        nama: 'Player9',
        health: 100,
        ammo: 30,
        position: { x: 200, y: 200 },
        team: 'putih',
        isAlive: true,
        kills: 0,
        deaths: 0
      },
      {
        id: '10',
        nama: 'Player10',
        health: 100,
        ammo: 30,
        position: { x: 250, y: 200 },
        team: 'putih',
        isAlive: true,
        kills: 0,
        deaths: 0
      }
    ],
    winner: null
  })

  const [showMap, setShowMap] = useState(false)
  const [showInventory, setShowInventory] = useState(false)
  const [showGameOver, setShowGameOver] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setGameState(prev => {
        const newTimeLeft = Math.max(0, prev.timeLeft - 1)
        
        // Check if time is up
        if (newTimeLeft === 0) {
          const merahAlive = prev.players.filter(p => p.team === 'merah' && p.isAlive).length
          const putihAlive = prev.players.filter(p => p.team === 'putih' && p.isAlive).length
          
          let winner: 'merah' | 'putih' | null = null
          if (merahAlive > putihAlive) winner = 'merah'
          else if (putihAlive > merahAlive) winner = 'putih'
          else winner = 'merah' // Tie goes to red team
          
          return {
            ...prev,
            timeLeft: 0,
            status: 'finished',
            winner,
            score: { merah: merahAlive, putih: putihAlive }
          }
        }
        
        return {
          ...prev,
          timeLeft: newTimeLeft
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Simulate player eliminations
  useEffect(() => {
    const eliminationTimer = setInterval(() => {
      setGameState(prev => {
        if (prev.status === 'finished') return prev
        
        const alivePlayers = prev.players.filter(p => p.isAlive)
        if (alivePlayers.length <= 1) {
          const winner = alivePlayers[0]?.team || 'merah'
          return {
            ...prev,
            status: 'finished',
            winner,
            score: { 
              merah: prev.players.filter(p => p.team === 'merah' && p.isAlive).length,
              putih: prev.players.filter(p => p.team === 'putih' && p.isAlive).length
            }
          }
        }
        
        // Randomly eliminate a player every 30 seconds
        if (Math.random() < 0.1 && alivePlayers.length > 1) {
          const randomPlayer = alivePlayers[Math.floor(Math.random() * alivePlayers.length)]
          const updatedPlayers = prev.players.map(p => 
            p.id === randomPlayer.id ? { ...p, isAlive: false, health: 0 } : p
          )
          
          return {
            ...prev,
            players: updatedPlayers,
            score: {
              merah: updatedPlayers.filter(p => p.team === 'merah' && p.isAlive).length,
              putih: updatedPlayers.filter(p => p.team === 'putih' && p.isAlive).length
            }
          }
        }
        
        return prev
      })
    }, 3000)

    return () => clearInterval(eliminationTimer)
  }, [])

  useEffect(() => {
    if (gameState.status === 'finished') {
      setShowGameOver(true)
    }
  }, [gameState.status])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getHealthColor = (health: number) => {
    if (health > 70) return 'text-green-400'
    if (health > 30) return 'text-yellow-400'
    return 'text-red-400'
  }

  const merahAlive = gameState.players.filter(p => p.team === 'merah' && p.isAlive).length
  const putihAlive = gameState.players.filter(p => p.team === 'putih' && p.isAlive).length

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* AR Camera View */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black">
        {/* Grid overlay untuk AR */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute border border-blue-500/30"
              style={{
                left: `${i * 5}%`,
                top: 0,
                width: '1px',
                height: '100%'
              }}
            />
          ))}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute border border-blue-500/30"
              style={{
                top: `${i * 5}%`,
                left: 0,
                height: '1px',
                width: '100%'
              }}
            />
          ))}
        </div>

        {/* Players */}
        {gameState.players.filter(p => p.isAlive).map((player) => (
          <div
            key={player.id}
            className="absolute w-16 h-16 flex items-center justify-center"
            style={{
              left: `${player.position.x}px`,
              top: `${player.position.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className={`w-12 h-12 rounded-full border-2 ${
              player.team === 'merah' ? 'border-red-500 bg-red-500/20' : 'border-white bg-white/20'
            } ${player.isAlive ? 'animate-pulse' : 'opacity-50'}`}>
              <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold">
                {player.team === 'merah' ? '🔴' : '⚪'}
              </div>
            </div>
            
            {/* Player info */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 rounded px-2 py-1 text-xs text-white whitespace-nowrap">
              <div className="text-center">{player.nama}</div>
              <div className={`text-center ${getHealthColor(player.health)}`}>
                HP: {player.health}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top HUD */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <div className="card flex items-center space-x-4">
            <div className="text-white">
              <div className="text-sm text-gray-400">Waktu</div>
              <div className={`text-xl font-bold ${gameState.timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {formatTime(gameState.timeLeft)}
              </div>
            </div>
            <div className="text-white">
              <div className="text-sm text-gray-400">Score</div>
              <div className="text-xl font-bold">
                <span className="text-red-400">{merahAlive}</span>
                <span className="text-gray-400"> - </span>
                <span className="text-white">{putihAlive}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <button 
              onClick={() => setShowMap(!showMap)}
              className="text-white hover:text-blue-400 transition-colors"
            >
              🗺️ Peta
            </button>
          </div>
        </div>

        {/* Bottom HUD */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="card flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="text-white">
                <div className="text-sm text-gray-400">Health</div>
                <div className="text-xl font-bold text-green-400">100%</div>
              </div>
              <div className="text-white">
                <div className="text-sm text-gray-400">Ammo</div>
                <div className="text-xl font-bold text-yellow-400">30</div>
              </div>
            </div>

            <div className="flex space-x-2">
              <button 
                onClick={() => setShowInventory(!showInventory)}
                className="btn-secondary text-sm px-4 py-2"
              >
                📦 Inventory
              </button>
              <button className="btn-primary text-sm px-4 py-2">
                🔫 Shoot
              </button>
            </div>
          </div>
        </div>

        {/* Left HUD - Controls */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <div className="card space-y-2">
            <button className="w-12 h-12 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors">
              ⬆️
            </button>
            <div className="flex space-x-2">
              <button className="w-12 h-12 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors">
                ⬅️
              </button>
              <button className="w-12 h-12 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors">
                ➡️
              </button>
            </div>
            <button className="w-12 h-12 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors">
              ⬇️
            </button>
          </div>
        </div>

        {/* Right HUD - Actions */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <div className="card space-y-2">
            <button className="w-12 h-12 bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors">
              🛡️
            </button>
            <button className="w-12 h-12 bg-green-600 rounded-full text-white hover:bg-green-700 transition-colors">
              🏃
            </button>
            <button className="w-12 h-12 bg-yellow-600 rounded-full text-white hover:bg-yellow-700 transition-colors">
              🎯
            </button>
          </div>
        </div>
      </div>

      {/* Game Over Modal */}
      {showGameOver && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              {gameState.winner === 'merah' ? '🔴 Tim Merah Menang!' : '⚪ Tim Putih Menang!'}
            </h2>
            
            <div className="mb-6">
              <div className="text-6xl mb-4">
                {gameState.winner === 'merah' ? '🏆' : '🏆'}
              </div>
              <p className="text-gray-300 mb-4">
                Final Score: {merahAlive} - {putihAlive}
              </p>
              <p className="text-gray-400 text-sm">
                Waktu: {formatTime(300 - gameState.timeLeft)}
              </p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => window.location.href = '/lobby'}
                className="btn-primary w-full"
              >
                🎮 Main Lagi
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="btn-secondary w-full"
              >
                🏠 Kembali ke Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {showMap && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Peta Battle</h2>
              <button 
                onClick={() => setShowMap(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 h-96 relative">
              {/* Mini map content */}
              <div className="w-full h-full bg-gradient-to-br from-green-900 to-blue-900 rounded-lg relative">
                {gameState.players.filter(p => p.isAlive).map((player) => (
                  <div
                    key={player.id}
                    className={`absolute w-4 h-4 rounded-full ${
                      player.team === 'merah' ? 'bg-red-500' : 'bg-white'
                    }`}
                    style={{
                      left: `${(player.position.x / 400) * 100}%`,
                      top: `${(player.position.y / 300) * 100}%`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Modal */}
      {showInventory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Inventory</h2>
              <button 
                onClick={() => setShowInventory(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { name: 'Rifle', icon: '🔫', ammo: 30 },
                { name: 'Pistol', icon: '🔫', ammo: 15 },
                { name: 'Grenade', icon: '💣', ammo: 3 },
                { name: 'Medkit', icon: '🏥', ammo: 2 },
                { name: 'Shield', icon: '🛡️', ammo: 1 },
                { name: 'Smoke', icon: '💨', ammo: 5 },
                { name: 'Flash', icon: '⚡', ammo: 3 },
                { name: 'Scope', icon: '🔍', ammo: 1 }
              ].map((item, index) => (
                <div key={index} className="card text-center p-4">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <div className="text-white text-sm font-bold">{item.name}</div>
                  <div className="text-gray-400 text-xs">{item.ammo}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Exit Button */}
      <div className="absolute top-4 right-4">
        <Link href="/lobby">
          <button className="btn-secondary text-sm px-4 py-2">
            Keluar Game
          </button>
        </Link>
      </div>
    </div>
  )
} 