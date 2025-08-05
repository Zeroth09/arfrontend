'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { MultiplayerWebSocket, GameMessage } from '@/lib/websocket'

interface Player {
  id: string
  nama: string
  tim: 'merah' | 'putih'
  joinedAt: Date
}

interface GameState {
  status: 'waiting' | 'starting' | 'playing' | 'finished'
  timeLeft: number
  players: Player[]
  gameMaster: boolean
}

interface LobbyMessage extends GameMessage {
  data: {
    player?: Player
    status?: 'waiting' | 'starting' | 'playing' | 'finished'
    timeLeft?: number
    players?: Player[]
  }
}

export default function LobbyPage() {
  const [gameState, setGameState] = useState<GameState>({
    status: 'waiting',
    timeLeft: 300, // 5 menit
    players: [],
    gameMaster: false
  })
  const [isConnected, setIsConnected] = useState(false)
  const [multiplayer, setMultiplayer] = useState<MultiplayerWebSocket | null>(null)
  const currentPlayerRef = useRef<Player | null>(null)

  // Initialize current player and WebSocket connection
  useEffect(() => {
    const playerData = localStorage.getItem('playerData')
    if (playerData) {
      try {
        const rawData = JSON.parse(playerData)
        
        // Create player object with required fields
        const currentPlayer: Player = {
          id: rawData.id || Math.random().toString(36).substr(2, 9),
          nama: rawData.nama || 'Unknown Player',
          tim: rawData.tim || 'merah',
          joinedAt: rawData.joinedAt ? new Date(rawData.joinedAt) : new Date()
        }
        
        currentPlayerRef.current = currentPlayer
        
        // Initialize WebSocket connection
        const serverUrl = 'https://backendairsoftar-production.up.railway.app'
        const ws = new MultiplayerWebSocket(serverUrl, currentPlayer.id, (message) => {
          console.log('Received lobby message:', message)
          
          switch (message.type) {
            case 'player_join':
              handlePlayerJoin(message)
              break
            case 'player_leave':
              handlePlayerLeave(message)
              break
            case 'game_state':
              handleGameStateUpdate(message)
              break
            case 'current_players': // Added handler for current_players event
              handleCurrentPlayers(message)
              break
          }
        })
        
        setMultiplayer(ws)
        ws.connect()
        setIsConnected(true)
        
        // Send player join message
        setTimeout(() => {
          ws.emit('player_join', {
            playerId: currentPlayer.id,
            player: currentPlayer,
            timestamp: Date.now()
          })
        }, 1000)
        
        // Add current player to local state
        setGameState(prev => ({
          ...prev,
          players: [currentPlayer]
        }))
        
      } catch (error) {
        console.error('Error parsing player data:', error)
        // Fallback player data
        const fallbackPlayer: Player = {
          id: Math.random().toString(36).substr(2, 9),
          nama: 'Player',
          tim: 'merah',
          joinedAt: new Date()
        }
        currentPlayerRef.current = fallbackPlayer
        setGameState(prev => ({
          ...prev,
          players: [fallbackPlayer]
        }))
      }
    }
    
    return () => {
      if (multiplayer) {
        multiplayer.disconnect()
      }
    }
  }, [multiplayer])

  // Handle incoming messages
  const handlePlayerJoin = (message: LobbyMessage) => {
    console.log('👥 Player joined:', message.data.player);
    setGameState(prev => ({
      ...prev,
      players: [...prev.players, message.data.player as Player]
    }));
  };

  const handlePlayerLeave = (message: LobbyMessage) => {
    console.log('👋 Player left:', message.playerId);
    setGameState(prev => ({
      ...prev,
      players: prev.players.filter(p => p.id !== message.playerId)
    }));
  };

  const handleGameStateUpdate = (message: LobbyMessage) => {
    console.log('🎮 Game state updated:', message.data);
    setGameState(prev => ({
      ...prev,
      status: message.data.status as 'waiting' | 'starting' | 'playing' | 'finished',
      timeLeft: message.data.timeLeft || prev.timeLeft
    }));
  };

  const handleCurrentPlayers = (message: LobbyMessage) => {
    console.log('📋 Received current players:', message.data.players);
    setGameState(prev => ({
      ...prev,
      players: message.data.players as Player[]
    }));
  };

  const merahPlayers = gameState.players.filter(p => p.tim === 'merah')
  const putihPlayers = gameState.players.filter(p => p.tim === 'putih')

  const canStartGame = merahPlayers.length >= 1 && putihPlayers.length >= 1

  const handleStartGame = () => {
    setGameState(prev => ({
      ...prev,
      status: 'starting'
    }))
    
    // Send game start message to all players
    if (multiplayer) {
      multiplayer.sendMessage({
        type: 'game_state',
        playerId: currentPlayerRef.current?.id || '',
        data: {
          status: 'starting',
          timeLeft: 300,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      })
    }
    
    // Simulate game starting
    setTimeout(() => {
      window.location.href = '/game'
    }, 3000)
  }

  const handleLeaveLobby = () => {
    // Send leave message to server
    if (multiplayer && currentPlayerRef.current) {
      multiplayer.sendMessage({
        type: 'player_leave',
        playerId: currentPlayerRef.current.id,
        data: {
          player: currentPlayerRef.current,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      })
    }
    
    localStorage.removeItem('playerData')
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-white hover:text-blue-400 transition-colors">
            ← Kembali ke Home
          </Link>
          <h1 className="text-3xl font-bold text-glow">Game Lobby</h1>
          <button 
            onClick={handleLeaveLobby}
            className="btn-secondary text-sm px-4 py-2"
          >
            Keluar Lobby
          </button>
        </div>

        {/* Game Status */}
        <div className="card mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              {gameState.status === 'waiting' && 'Menunggu Pemain Bergabung...'}
              {gameState.status === 'starting' && 'Game Akan Dimulai...'}
              {gameState.status === 'playing' && 'Game Sedang Berlangsung'}
              {gameState.status === 'finished' && 'Game Selesai'}
            </h2>
            
            {/* Multiplayer Status */}
            <div className="mb-4">
              <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg ${
                isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-semibold">
                  {isConnected ? '🟢 Multiplayer Connected' : '🔴 Multiplayer Disconnected'}
                </span>
              </div>
              <div className="text-sm text-gray-400 mt-2">
                Players Online: {gameState.players.length}
              </div>
            </div>
            
            {gameState.status === 'starting' && (
              <div className="text-3xl font-bold text-yellow-400 animate-pulse">
                Game akan dimulai dalam 3 detik...
              </div>
            )}
          </div>
        </div>

        {/* Player Count */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card text-center">
            <div className="text-3xl mb-2">🔴</div>
            <div className="text-2xl font-bold text-red-400">{merahPlayers.length}/5</div>
            <div className="text-gray-400">Tim Merah</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl mb-2">⚪</div>
            <div className="text-2xl font-bold text-white">{putihPlayers.length}/5</div>
            <div className="text-gray-400">Tim Putih</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-2xl font-bold text-blue-400">{gameState.players.length}/10</div>
            <div className="text-gray-400">Total Pemain</div>
          </div>
        </div>

        {/* Teams Display */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Tim Merah */}
          <div className="card">
            <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center">
              🔴 Tim Merah ({merahPlayers.length}/5)
            </h3>
            <div className="space-y-2">
              {merahPlayers.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                      {player.nama.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-semibold">{player.nama}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Joined: {player.joinedAt ? player.joinedAt.toLocaleTimeString() : 'N/A'}
                  </div>
                </div>
              ))}
              {merahPlayers.length < 5 && (
                <div className="text-gray-500 text-center py-4">
                  Menunggu {5 - merahPlayers.length} pemain lagi...
                </div>
              )}
            </div>
          </div>

          {/* Tim Putih */}
          <div className="card">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              ⚪ Tim Putih ({putihPlayers.length}/5)
            </h3>
            <div className="space-y-2">
              {putihPlayers.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-900 font-bold">
                      {player.nama.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-semibold">{player.nama}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Joined: {player.joinedAt ? player.joinedAt.toLocaleTimeString() : 'N/A'}
                  </div>
                </div>
              ))}
              {putihPlayers.length < 5 && (
                <div className="text-gray-500 text-center py-4">
                  Menunggu {5 - putihPlayers.length} pemain lagi...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Game Master Controls */}
        <div className="card text-center">
          <h3 className="text-xl font-bold text-white mb-4">Game Master Controls</h3>
          
          {canStartGame ? (
            <div className="space-y-4">
              <p className="text-green-400 font-semibold">
                ✅ Semua pemain sudah bergabung! Game siap dimulai.
              </p>
              <button 
                onClick={handleStartGame}
                disabled={gameState.status === 'starting'}
                className="btn-primary text-lg px-8 py-4 disabled:opacity-50"
              >
                🚀 Mulai Game 5v5
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-yellow-400 font-semibold">
                ⏳ Menunggu pemain bergabung... ({gameState.players.length}/10)
              </p>
              <div className="text-gray-400">
                Butuh minimal 5 pemain per tim untuk memulai game
              </div>
            </div>
          )}
        </div>

        {/* Game Rules */}
        <div className="card mt-8">
          <h3 className="text-xl font-bold text-white mb-4">📋 Aturan Game</h3>
          <div className="grid md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h4 className="font-bold text-white mb-2">🎯 Objective</h4>
              <ul className="space-y-1 text-sm">
                <li>• Eliminasi total tim lawan dalam 5 menit</li>
                <li>• Tim dengan sisa pemain terbanyak menang jika waktu habis</li>
                <li>• Setiap pemain memiliki 1 nyawa</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">⚔️ Gameplay</h4>
              <ul className="space-y-1 text-sm">
                <li>• 5v5 Team Deathmatch</li>
                <li>• Waktu: 5 menit</li>
                <li>• Lokasi: AR Battle Arena</li>
                <li>• Weapons: Airsoft guns</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 