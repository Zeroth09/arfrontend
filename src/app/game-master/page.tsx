'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MultiplayerWebSocket } from '@/lib/websocket'

interface GameMasterState {
  status: 'waiting' | 'preparing' | 'active' | 'finished'
  players: Array<{
    id: string
    nama: string
    tim: 'merah' | 'putih'
    status: 'waiting' | 'ready' | 'playing' | 'eliminated'
    joinedAt: Date
  }>
  gameSettings: {
    duration: number // minutes
    maxPlayers: number
    mapSize: number // meters
    targetRange: number // meters
  }
  gameStats: {
    totalKills: number
    totalDeaths: number
    gameStartTime: number | null
    gameEndTime: number | null
  }
}

export default function GameMasterPage() {
  const router = useRouter()
  const [gameState, setGameState] = useState<GameMasterState>({
    status: 'waiting',
    players: [],
    gameSettings: {
      duration: 5, // 5 minutes
      maxPlayers: 10,
      mapSize: 500, // 500 meters
      targetRange: 500
    },
    gameStats: {
      totalKills: 0,
      totalDeaths: 0,
      gameStartTime: null,
      gameEndTime: null
    }
  })

  const [connectionStatus, setConnectionStatus] = useState('Connecting...')
  const [serverUrl, setServerUrl] = useState('https://confident-clarity-production.up.railway.app')
  const multiplayerRef = useRef<MultiplayerWebSocket | null>(null)

  // Initialize game master connection
  useEffect(() => {
    const initializeGameMaster = async () => {
      try {
        // Create game master connection
        const gameMaster = new MultiplayerWebSocket(serverUrl, 'game-master')
        
        gameMaster.onMessage((message) => {
          console.log('📨 Game Master received:', message)
          
          if (message.type === 'player_join') {
            handlePlayerJoin(message)
          } else if (message.type === 'player_leave') {
            handlePlayerLeave(message)
          } else if (message.type === 'player_ready') {
            handlePlayerReady(message)
          } else if (message.type === 'game_stats_update') {
            handleGameStatsUpdate(message)
          }
        })

        gameMaster.onConnectionStatus((status) => {
          setConnectionStatus(status)
          console.log('🔗 Game Master connection status:', status)
        })

        // Connect as game master
        await gameMaster.connect()
        multiplayerRef.current = gameMaster

        // Emit game master join
        gameMaster.emit('game_master_join', {
          gameMasterId: 'master-001',
          gameSettings: gameState.gameSettings,
          timestamp: Date.now()
        })

      } catch (error) {
        console.error('❌ Failed to initialize game master:', error)
        setConnectionStatus('Connection failed')
      }
    }

    initializeGameMaster()

    return () => {
      if (multiplayerRef.current) {
        multiplayerRef.current.disconnect()
      }
    }
  }, [])

  // Handle player joining lobby
  const handlePlayerJoin = (message: any) => {
    const newPlayer = {
      id: message.data.playerId,
      nama: message.data.player.nama,
      tim: message.data.player.tim,
      status: 'waiting' as const,
      joinedAt: new Date()
    }

    setGameState(prev => ({
      ...prev,
      players: [...prev.players, newPlayer]
    }))

    // Notify all players about new player
    if (multiplayerRef.current) {
      multiplayerRef.current.emit('player_joined_lobby', {
        player: newPlayer,
        totalPlayers: gameState.players.length + 1,
        timestamp: Date.now()
      })
    }
  }

  // Handle player leaving
  const handlePlayerLeave = (message: any) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.filter(p => p.id !== message.data.playerId)
    }))

    // Notify all players about player leaving
    if (multiplayerRef.current) {
      multiplayerRef.current.emit('player_left_lobby', {
        playerId: message.data.playerId,
        totalPlayers: gameState.players.length - 1,
        timestamp: Date.now()
      })
    }
  }

  // Handle player ready status
  const handlePlayerReady = (message: any) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.id === message.data.playerId 
          ? { ...p, status: 'ready' }
          : p
      )
    }))
  }

  // Handle game stats update
  const handleGameStatsUpdate = (message: any) => {
    setGameState(prev => ({
      ...prev,
      gameStats: {
        ...prev.gameStats,
        totalKills: message.data.totalKills || prev.gameStats.totalKills,
        totalDeaths: message.data.totalDeaths || prev.gameStats.totalDeaths
      }
    }))
  }

  // Start game
  const startGame = () => {
    if (gameState.players.length < 2) {
      alert('Minimal 2 pemain diperlukan untuk memulai game!')
      return
    }

    setGameState(prev => ({
      ...prev,
      status: 'active',
      gameStats: {
        ...prev.gameStats,
        gameStartTime: Date.now()
      }
    }))

    // Notify all players to start game
    if (multiplayerRef.current) {
      multiplayerRef.current.emit('game_start', {
        gameSettings: gameState.gameSettings,
        players: gameState.players,
        timestamp: Date.now()
      })
    }

    console.log('🎮 Game started!')
  }

  // End game
  const endGame = () => {
    setGameState(prev => ({
      ...prev,
      status: 'finished',
      gameStats: {
        ...prev.gameStats,
        gameEndTime: Date.now()
      }
    }))

    // Notify all players to end game
    if (multiplayerRef.current) {
      multiplayerRef.current.emit('game_end', {
        gameStats: gameState.gameStats,
        timestamp: Date.now()
      })
    }

    console.log('🏁 Game ended!')
  }

  // Reset game
  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      status: 'waiting',
      players: [],
      gameStats: {
        totalKills: 0,
        totalDeaths: 0,
        gameStartTime: null,
        gameEndTime: null
      }
    }))

    // Notify all players about reset
    if (multiplayerRef.current) {
      multiplayerRef.current.emit('game_reset', {
        timestamp: Date.now()
      })
    }
  }

  // Update game settings
  const updateGameSettings = (setting: keyof GameMasterState['gameSettings'], value: number) => {
    setGameState(prev => ({
      ...prev,
      gameSettings: {
        ...prev.gameSettings,
        [setting]: value
      }
    }))
  }

  const readyPlayers = gameState.players.filter(p => p.status === 'ready').length
  const totalPlayers = gameState.players.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">🎮 Game Master Control</h1>
              <p className="text-gray-300">Mengontrol pertandingan Airsoft AR Battle</p>
            </div>
            <div className="text-right">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                connectionStatus === 'Connected' ? 'bg-green-500/20 text-green-400' :
                connectionStatus === 'Connecting...' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {connectionStatus}
              </div>
              <div className="text-gray-400 text-sm mt-1">
                Players: {totalPlayers}/{gameState.gameSettings.maxPlayers}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Game Control Panel */}
          <div className="lg:col-span-1">
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">🎮 Game Control</h2>
              
              {/* Game Status */}
              <div className="mb-6">
                <div className="text-sm text-gray-400 mb-2">Game Status</div>
                <div className={`px-4 py-2 rounded-lg font-medium ${
                  gameState.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
                  gameState.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  gameState.status === 'finished' ? 'bg-red-500/20 text-red-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {gameState.status === 'waiting' ? '⏳ Waiting for Players' :
                   gameState.status === 'active' ? '🎯 Game Active' :
                   gameState.status === 'finished' ? '🏁 Game Finished' :
                   '🔄 Preparing'}
                </div>
              </div>

              {/* Game Settings */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">⚙️ Game Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-400">Duration (minutes)</label>
                    <input
                      type="number"
                      value={gameState.gameSettings.duration}
                      onChange={(e) => updateGameSettings('duration', parseInt(e.target.value))}
                      className="w-full mt-1 px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white"
                      min="1"
                      max="30"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Max Players</label>
                    <input
                      type="number"
                      value={gameState.gameSettings.maxPlayers}
                      onChange={(e) => updateGameSettings('maxPlayers', parseInt(e.target.value))}
                      className="w-full mt-1 px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white"
                      min="2"
                      max="20"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Map Size (meters)</label>
                    <input
                      type="number"
                      value={gameState.gameSettings.mapSize}
                      onChange={(e) => updateGameSettings('mapSize', parseInt(e.target.value))}
                      className="w-full mt-1 px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white"
                      min="100"
                      max="1000"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Target Range (meters)</label>
                    <input
                      type="number"
                      value={gameState.gameSettings.targetRange}
                      onChange={(e) => updateGameSettings('targetRange', parseInt(e.target.value))}
                      className="w-full mt-1 px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white"
                      min="100"
                      max="1000"
                    />
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="space-y-3">
                {gameState.status === 'waiting' && (
                  <button
                    onClick={startGame}
                    disabled={readyPlayers < 2}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                      readyPlayers >= 2
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    🚀 Start Game ({readyPlayers}/{Math.max(2, totalPlayers)} ready)
                  </button>
                )}
                
                {gameState.status === 'active' && (
                  <button
                    onClick={endGame}
                    className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                  >
                    🏁 End Game
                  </button>
                )}
                
                {gameState.status === 'finished' && (
                  <button
                    onClick={resetGame}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    🔄 Reset Game
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Players List */}
          <div className="lg:col-span-2">
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">👥 Players ({totalPlayers})</h2>
              
              {gameState.players.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">👤</div>
                  <div className="text-gray-400">Belum ada pemain yang bergabung</div>
                  <div className="text-sm text-gray-500 mt-2">Pemain akan muncul di sini saat bergabung ke lobby</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gameState.players.map((player) => (
                    <div
                      key={player.id}
                      className="bg-black/50 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">{player.nama}</div>
                          <div className="text-sm text-gray-400">
                            Team: {player.tim === 'merah' ? '🔴 Merah' : '⚪ Putih'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Joined: {player.joinedAt.toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            player.status === 'ready' ? 'bg-green-500/20 text-green-400' :
                            player.status === 'playing' ? 'bg-blue-500/20 text-blue-400' :
                            player.status === 'eliminated' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {player.status === 'ready' ? '✅ Ready' :
                             player.status === 'playing' ? '🎯 Playing' :
                             player.status === 'eliminated' ? '💀 Eliminated' :
                             '⏳ Waiting'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Game Stats */}
        {gameState.status === 'active' && (
          <div className="mt-8">
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">📊 Game Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{gameState.gameStats.totalKills}</div>
                  <div className="text-gray-400">Total Kills</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-400">{gameState.gameStats.totalDeaths}</div>
                  <div className="text-gray-400">Total Deaths</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">
                    {gameState.gameStats.gameStartTime ? 
                      Math.floor((Date.now() - gameState.gameStats.gameStartTime) / 1000) : 0}s
                  </div>
                  <div className="text-gray-400">Game Time</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 