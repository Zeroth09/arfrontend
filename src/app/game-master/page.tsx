'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Player {
  id: string
  nama: string
  tim: 'merah' | 'putih'
  health: number
  ammo: number
  position: { x: number; y: number }
  isAlive: boolean
  kills: number
  deaths: number
  lastSeen: Date
}

interface GameMasterState {
  status: 'waiting' | 'playing' | 'paused' | 'finished'
  timeLeft: number
  players: Player[]
  selectedPlayer: string | null
  viewMode: 'overview' | 'player' | 'spectator'
}

export default function GameMasterPage() {
  const [gameState, setGameState] = useState<GameMasterState>({
    status: 'waiting',
    timeLeft: 300,
    players: [],
    selectedPlayer: null,
    viewMode: 'overview'
  })

  const [showCameraView, setShowCameraView] = useState(false)

  useEffect(() => {
    // Simulate players joining
    const mockPlayers: Player[] = [
      { id: '1', nama: 'Player1', tim: 'merah', health: 100, ammo: 30, position: { x: 50, y: 50 }, isAlive: true, kills: 0, deaths: 0, lastSeen: new Date() },
      { id: '2', nama: 'Player2', tim: 'merah', health: 100, ammo: 30, position: { x: 100, y: 50 }, isAlive: true, kills: 0, deaths: 0, lastSeen: new Date() },
      { id: '3', nama: 'Player3', tim: 'merah', health: 100, ammo: 30, position: { x: 150, y: 50 }, isAlive: true, kills: 0, deaths: 0, lastSeen: new Date() },
      { id: '4', nama: 'Player4', tim: 'merah', health: 100, ammo: 30, position: { x: 200, y: 50 }, isAlive: true, kills: 0, deaths: 0, lastSeen: new Date() },
      { id: '5', nama: 'Player5', tim: 'merah', health: 100, ammo: 30, position: { x: 250, y: 50 }, isAlive: true, kills: 0, deaths: 0, lastSeen: new Date() },
      { id: '6', nama: 'Player6', tim: 'putih', health: 100, ammo: 30, position: { x: 50, y: 200 }, isAlive: true, kills: 0, deaths: 0, lastSeen: new Date() },
      { id: '7', nama: 'Player7', tim: 'putih', health: 100, ammo: 30, position: { x: 100, y: 200 }, isAlive: true, kills: 0, deaths: 0, lastSeen: new Date() },
      { id: '8', nama: 'Player8', tim: 'putih', health: 100, ammo: 30, position: { x: 150, y: 200 }, isAlive: true, kills: 0, deaths: 0, lastSeen: new Date() },
      { id: '9', nama: 'Player9', tim: 'putih', health: 100, ammo: 30, position: { x: 200, y: 200 }, isAlive: true, kills: 0, deaths: 0, lastSeen: new Date() },
      { id: '10', nama: 'Player10', tim: 'putih', health: 100, ammo: 30, position: { x: 250, y: 200 }, isAlive: true, kills: 0, deaths: 0, lastSeen: new Date() }
    ]

    setGameState(prev => ({
      ...prev,
      players: mockPlayers
    }))
  }, [])

  useEffect(() => {
    if (gameState.status === 'playing') {
      const timer = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          timeLeft: Math.max(0, prev.timeLeft - 1)
        }))
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [gameState.status])

  const handleStartGame = () => {
    setGameState(prev => ({
      ...prev,
      status: 'playing'
    }))
  }

  const handlePauseGame = () => {
    setGameState(prev => ({
      ...prev,
      status: prev.status === 'playing' ? 'paused' : 'playing'
    }))
  }

  const handleStopGame = () => {
    setGameState(prev => ({
      ...prev,
      status: 'finished'
    }))
  }

  const handleSelectPlayer = (playerId: string) => {
    setGameState(prev => ({
      ...prev,
      selectedPlayer: playerId,
      viewMode: 'player'
    }))
  }

  const handleSpectatorMode = () => {
    setGameState(prev => ({
      ...prev,
      viewMode: 'spectator'
    }))
    setShowCameraView(true)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const merahPlayers = gameState.players.filter(p => p.tim === 'merah')
  const putihPlayers = gameState.players.filter(p => p.tim === 'putih')
  const alivePlayers = gameState.players.filter(p => p.isAlive)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-white hover:text-blue-400 transition-colors">
            ← Kembali ke Home
          </Link>
          <h1 className="text-3xl font-bold text-glow">Game Master Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              gameState.status === 'playing' ? 'bg-green-500 text-white' :
              gameState.status === 'paused' ? 'bg-yellow-500 text-black' :
              gameState.status === 'finished' ? 'bg-red-500 text-white' :
              'bg-gray-500 text-white'
            }`}>
              {gameState.status.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Game Controls */}
        <div className="card mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Game Controls</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleStartGame}
              disabled={gameState.status === 'playing'}
              className="btn-primary disabled:opacity-50"
            >
              ▶️ Start Game
            </button>
            <button
              onClick={handlePauseGame}
              disabled={gameState.status === 'waiting'}
              className="btn-secondary disabled:opacity-50"
            >
              {gameState.status === 'paused' ? '▶️ Resume' : '⏸️ Pause'}
            </button>
            <button
              onClick={handleStopGame}
              disabled={gameState.status === 'waiting'}
              className="btn-danger disabled:opacity-50"
            >
              ⏹️ Stop Game
            </button>
            <button
              onClick={handleSpectatorMode}
              className="btn-secondary"
            >
              📹 Spectator Mode
            </button>
          </div>
        </div>

        {/* Game Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <div className="text-3xl mb-2">⏱️</div>
            <div className="text-2xl font-bold text-white">{formatTime(gameState.timeLeft)}</div>
            <div className="text-gray-400">Time Left</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl mb-2">🔴</div>
            <div className="text-2xl font-bold text-red-400">{merahPlayers.filter(p => p.isAlive).length}/5</div>
            <div className="text-gray-400">Tim Merah Alive</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl mb-2">⚪</div>
            <div className="text-2xl font-bold text-white">{putihPlayers.filter(p => p.isAlive).length}/5</div>
            <div className="text-gray-400">Tim Putih Alive</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-2xl font-bold text-blue-400">{alivePlayers.length}/10</div>
            <div className="text-gray-400">Total Alive</div>
          </div>
        </div>

        {/* Player Management */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Tim Merah */}
          <div className="card">
            <h3 className="text-xl font-bold text-red-400 mb-4">🔴 Tim Merah</h3>
            <div className="space-y-3">
              {merahPlayers.map((player) => (
                <div 
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    player.isAlive 
                      ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20' 
                      : 'bg-gray-700 border-gray-600 opacity-50'
                  } ${gameState.selectedPlayer === player.id ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => handleSelectPlayer(player.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      player.isAlive ? 'bg-red-500' : 'bg-gray-600'
                    }`}>
                      {player.nama.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{player.nama}</div>
                      <div className="text-gray-400 text-sm">
                        HP: {player.health}% | Ammo: {player.ammo}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">
                      Kills: {player.kills} | Deaths: {player.deaths}
                    </div>
                    <div className="text-xs text-gray-500">
                      {player.lastSeen.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tim Putih */}
          <div className="card">
            <h3 className="text-xl font-bold text-white mb-4">⚪ Tim Putih</h3>
            <div className="space-y-3">
              {putihPlayers.map((player) => (
                <div 
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    player.isAlive 
                      ? 'bg-white/10 border-white/20 hover:bg-white/20' 
                      : 'bg-gray-700 border-gray-600 opacity-50'
                  } ${gameState.selectedPlayer === player.id ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => handleSelectPlayer(player.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-gray-900 font-bold ${
                      player.isAlive ? 'bg-white' : 'bg-gray-600'
                    }`}>
                      {player.nama.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{player.nama}</div>
                      <div className="text-gray-400 text-sm">
                        HP: {player.health}% | Ammo: {player.ammo}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">
                      Kills: {player.kills} | Deaths: {player.deaths}
                    </div>
                    <div className="text-xs text-gray-500">
                      {player.lastSeen.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Map */}
        <div className="card mb-8">
          <h3 className="text-xl font-bold text-white mb-4">🗺️ Live Battle Map</h3>
          <div className="bg-gray-800 rounded-lg p-4 h-96 relative">
            <div className="w-full h-full bg-gradient-to-br from-green-900 to-blue-900 rounded-lg relative">
              {gameState.players.filter(p => p.isAlive).map((player) => (
                <div
                  key={player.id}
                  className={`absolute w-4 h-4 rounded-full ${
                    player.tim === 'merah' ? 'bg-red-500' : 'bg-white'
                  } ${gameState.selectedPlayer === player.id ? 'ring-2 ring-blue-400' : ''}`}
                  style={{
                    left: `${(player.position.x / 400) * 100}%`,
                    top: `${(player.position.y / 300) * 100}%`
                  }}
                  title={`${player.nama} (${player.tim})`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Game Actions */}
        <div className="card">
          <h3 className="text-xl font-bold text-white mb-4">⚡ Quick Actions</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <button className="btn-secondary">
              📢 Broadcast Message
            </button>
            <button className="btn-secondary">
              🎯 Highlight Player
            </button>
            <button className="btn-secondary">
              📊 Show Statistics
            </button>
            <button className="btn-secondary">
              🎮 Force Respawn
            </button>
            <button className="btn-secondary">
              ⚡ Emergency Stop
            </button>
            <button className="btn-secondary">
              📱 Send Alert
            </button>
          </div>
        </div>
      </div>

      {/* Camera View Modal */}
      {showCameraView && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="w-full h-full flex flex-col">
            <div className="flex justify-between items-center p-4 bg-gray-800">
              <h2 className="text-2xl font-bold text-white">📹 Live Camera View</h2>
              <button 
                onClick={() => setShowCameraView(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 bg-black flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">📹</div>
                <p className="text-xl">Live camera feed akan ditampilkan di sini</p>
                <p className="text-gray-400 mt-2">Kamera dari semua player akan ditampilkan secara real-time</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 