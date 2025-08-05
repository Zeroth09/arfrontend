'use client'

import { useState, useEffect } from 'react'
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
}

interface GameState {
  status: 'waiting' | 'countdown' | 'playing' | 'finished'
  timeLeft: number
  players: Player[]
  winner: 'merah' | 'putih' | null
  gameTime: number
}

export default function DemoPage() {
  const [gameState, setGameState] = useState<GameState>({
    status: 'waiting',
    timeLeft: 300, // 5 menit
    players: [],
    winner: null,
    gameTime: 0
  })

  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [cameraView, setCameraView] = useState<'overview' | 'player1' | 'player2'>('overview')

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
        position: { x: 100, y: 100 }
      },
      {
        id: 'player2',
        nama: 'Player 2 (Putih)',
        tim: 'putih',
        isAlive: true,
        health: 100,
        kills: 0,
        deaths: 0,
        position: { x: 400, y: 300 }
      }
    ]

    setGameState(prev => ({
      ...prev,
      players: demoPlayers
    }))
  }, [])

  // Game timer
  useEffect(() => {
    if (gameState.status === 'playing') {
      const timer = setInterval(() => {
        setGameState(prev => {
          const newTimeLeft = prev.timeLeft - 1
          const newGameTime = prev.gameTime + 1

          if (newTimeLeft <= 0) {
            // Game over - determine winner
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

    // Countdown
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
          position: { x: 100, y: 100 }
        },
        {
          id: 'player2',
          nama: 'Player 2 (Putih)',
          tim: 'putih',
          isAlive: true,
          health: 100,
          kills: 0,
          deaths: 0,
          position: { x: 400, y: 300 }
        }
      ],
      winner: null,
      gameTime: 0
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

      // Check if all players from one team are eliminated
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getPlayerByView = () => {
    if (cameraView === 'player1') return gameState.players.find(p => p.id === 'player1')
    if (cameraView === 'player2') return gameState.players.find(p => p.id === 'player2')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="text-white hover:text-blue-400 transition-colors">
            ← Kembali ke Home
          </Link>
          <h1 className="text-3xl font-bold text-glow">Demo 1v1 Gameplay</h1>
          <div className="text-white text-sm">
            Testing Mode - 2 Devices
          </div>
        </div>

        {/* Game Status */}
        <div className="card mb-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              {gameState.status === 'waiting' && 'Menunggu Game Dimulai...'}
              {gameState.status === 'countdown' && 'Game Akan Dimulai...'}
              {gameState.status === 'playing' && 'Game Sedang Berlangsung'}
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
                  🚀 Mulai Game Demo
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
            <h3 className="text-xl font-bold text-white mb-4">Camera Controls</h3>
            <div className="space-y-2">
              <button
                onClick={() => setCameraView('overview')}
                className={`w-full p-3 rounded-lg transition-colors ${
                  cameraView === 'overview'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                📷 Overview Camera
              </button>
              <button
                onClick={() => setCameraView('player1')}
                className={`w-full p-3 rounded-lg transition-colors ${
                  cameraView === 'player1'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                🎮 Player 1 Camera
              </button>
              <button
                onClick={() => setCameraView('player2')}
                className={`w-full p-3 rounded-lg transition-colors ${
                  cameraView === 'player2'
                    ? 'bg-white text-gray-900'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                🎮 Player 2 Camera
              </button>
            </div>
          </div>
        </div>

        {/* Game Arena */}
        <div className="card mb-6">
          <h3 className="text-xl font-bold text-white mb-4">
            {cameraView === 'overview' && '🎯 Game Arena - Overview'}
            {cameraView === 'player1' && '🎮 Player 1 View'}
            {cameraView === 'player2' && '🎮 Player 2 View'}
          </h3>

          <div className="relative bg-gray-800 rounded-lg p-6 min-h-[400px] border-2 border-gray-600">
            {/* Arena Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-blue-900/20 rounded-lg"></div>

            {/* Player 1 */}
            <div
              className={`absolute w-16 h-16 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ${
                gameState.players.find(p => p.id === 'player1')?.isAlive
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-gray-500 opacity-50'
              }`}
              style={{
                left: `${gameState.players.find(p => p.id === 'player1')?.position.x || 100}px`,
                top: `${gameState.players.find(p => p.id === 'player1')?.position.y || 100}px`
              }}
            >
              P1
            </div>

            {/* Player 2 */}
            <div
              className={`absolute w-16 h-16 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ${
                gameState.players.find(p => p.id === 'player2')?.isAlive
                  ? 'bg-white text-gray-900 animate-pulse'
                  : 'bg-gray-500 opacity-50'
              }`}
              style={{
                left: `${gameState.players.find(p => p.id === 'player2')?.position.x || 400}px`,
                top: `${gameState.players.find(p => p.id === 'player2')?.position.y || 300}px`
              }}
            >
              P2
            </div>

            {/* Camera View Indicator */}
            {cameraView !== 'overview' && (
              <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
                {cameraView === 'player1' ? 'Player 1 Camera' : 'Player 2 Camera'}
              </div>
            )}

            {/* Crosshair for player view */}
            {cameraView !== 'overview' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-8 h-8 border-2 border-red-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Player Stats */}
        <div className="grid md:grid-cols-2 gap-6">
          {gameState.players.map((player) => (
            <div key={player.id} className="card">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                {player.tim === 'merah' ? '🔴' : '⚪'} {player.nama}
                {!player.isAlive && <span className="ml-2 text-red-400">💀 ELIMINATED</span>}
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

        {/* Game Info */}
        <div className="card mt-6">
          <h3 className="text-xl font-bold text-white mb-4">📋 Demo Game Info</h3>
          <div className="grid md:grid-cols-3 gap-4 text-gray-300">
            <div>
              <h4 className="font-bold text-white mb-2">🎯 Objective</h4>
              <p className="text-sm">Eliminasi lawan dalam 1v1 battle</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">⏱️ Time Limit</h4>
              <p className="text-sm">5 menit atau eliminasi total</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">🎮 Controls</h4>
              <p className="text-sm">Simulasi eliminasi untuk testing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 