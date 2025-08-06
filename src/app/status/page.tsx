'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ServerStatus {
  status: 'online' | 'offline' | 'error'
  responseTime: number
  uptime: string
  players: number
  activeGames: number
  lastUpdate: Date
}

interface ApiEndpoint {
  name: string
  url: string
  status: 'online' | 'offline' | 'error'
  responseTime: number
  lastCheck: Date
}

export default function StatusPage() {
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    status: 'online',
    responseTime: 45,
    uptime: '2d 14h 32m',
    players: 156,
    activeGames: 8,
    lastUpdate: new Date()
  })

  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([
    {
      name: 'Server Health',
      url: 'https://confident-clarity-production.up.railway.app/',
      status: 'online',
      responseTime: 45,
      lastCheck: new Date()
    },
    {
      name: 'Authentication API',
      url: 'https://confident-clarity-production.up.railway.app/auth',
      status: 'online',
      responseTime: 52,
      lastCheck: new Date()
    },
    {
      name: 'Game API',
      url: 'https://confident-clarity-production.up.railway.app/game',
      status: 'online',
      responseTime: 38,
      lastCheck: new Date()
    },
    {
      name: 'WebSocket',
      url: 'wss://confident-clarity-production.up.railway.app/ws',
      status: 'online',
      responseTime: 12,
      lastCheck: new Date()
    }
  ])

  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    // Simulate periodic status checks
    const interval = setInterval(() => {
      setServerStatus(prev => ({
        ...prev,
        lastUpdate: new Date(),
        players: prev.players + Math.floor(Math.random() * 3) - 1,
        activeGames: prev.activeGames + Math.floor(Math.random() * 2) - 1
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleCheckStatus = async () => {
    setIsChecking(true)
    
    // Simulate API check
    setTimeout(() => {
      setEndpoints(prev => prev.map(endpoint => ({
        ...endpoint,
        responseTime: Math.floor(Math.random() * 100) + 20,
        lastCheck: new Date()
      })))
      setIsChecking(false)
    }, 2000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-400'
      case 'offline':
        return 'text-red-400'
      case 'error':
        return 'text-yellow-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return '🟢'
      case 'offline':
        return '🔴'
      case 'error':
        return '🟡'
      default:
        return '⚪'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-white hover:text-blue-400 transition-colors">
            ← Kembali ke Home
          </Link>
          <h1 className="text-3xl font-bold text-glow">Server Status</h1>
          <button 
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="btn-primary disabled:opacity-50"
          >
            {isChecking ? '🔄 Checking...' : '🔄 Refresh Status'}
          </button>
        </div>

        {/* Main Server Status */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Battle Proximity Server</h2>
            <div className="flex items-center space-x-2">
              <span className={getStatusIcon(serverStatus.status)}></span>
              <span className={`font-semibold ${getStatusColor(serverStatus.status)}`}>
                {serverStatus.status.toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{serverStatus.responseTime}ms</div>
              <div className="text-gray-400">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{serverStatus.uptime}</div>
              <div className="text-gray-400">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{serverStatus.players}</div>
              <div className="text-gray-400">Active Players</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{serverStatus.activeGames}</div>
              <div className="text-gray-400">Active Games</div>
            </div>
          </div>
          
          <div className="mt-6 text-center text-gray-400 text-sm">
            Last updated: {serverStatus.lastUpdate ? serverStatus.lastUpdate.toLocaleTimeString() : 'N/A'}
          </div>
        </div>

        {/* API Endpoints */}
        <div className="card mb-8">
          <h3 className="text-xl font-bold text-white mb-6">API Endpoints Status</h3>
          <div className="space-y-4">
            {endpoints.map((endpoint, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className={getStatusIcon(endpoint.status)}></span>
                  <div>
                    <div className="text-white font-semibold">{endpoint.name}</div>
                    <div className="text-gray-400 text-sm">{endpoint.url}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${getStatusColor(endpoint.status)}`}>
                    {endpoint.status.toUpperCase()}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {endpoint.responseTime}ms
                  </div>
                  <div className="text-xs text-gray-400">
                  {endpoint.lastCheck ? endpoint.lastCheck.toLocaleTimeString() : 'N/A'}
                </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Metrics */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="text-xl font-bold text-white mb-4">📊 System Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">CPU Usage</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <span className="text-white font-semibold">45%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Memory Usage</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '62%' }}></div>
                  </div>
                  <span className="text-white font-semibold">62%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Network</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '28%' }}></div>
                  </div>
                  <span className="text-white font-semibold">28%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Disk Space</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '73%' }}></div>
                  </div>
                  <span className="text-white font-semibold">73%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-xl font-bold text-white mb-4">🌐 Network Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Latency</span>
                <span className="text-green-400 font-semibold">45ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Packet Loss</span>
                <span className="text-green-400 font-semibold">0.1%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Bandwidth</span>
                <span className="text-blue-400 font-semibold">1.2 Gbps</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Connections</span>
                <span className="text-yellow-400 font-semibold">1,247</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="card">
          <h3 className="text-xl font-bold text-white mb-4">📋 Recent Events</h3>
          <div className="space-y-3">
            {[
              { time: '2 minutes ago', event: 'Game session started', type: 'info' },
              { time: '5 minutes ago', event: 'Player joined lobby', type: 'success' },
              { time: '8 minutes ago', event: 'Server maintenance completed', type: 'info' },
              { time: '12 minutes ago', event: 'High latency detected', type: 'warning' },
              { time: '15 minutes ago', event: 'Database backup completed', type: 'success' }
            ].map((event, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className={`text-sm ${
                    event.type === 'success' ? 'text-green-400' :
                    event.type === 'warning' ? 'text-yellow-400' :
                    'text-blue-400'
                  }`}>
                    {event.type === 'success' ? '✅' : event.type === 'warning' ? '⚠️' : 'ℹ️'}
                  </span>
                  <span className="text-white">{event.event}</span>
                </div>
                <span className="text-gray-400 text-sm">{event.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 