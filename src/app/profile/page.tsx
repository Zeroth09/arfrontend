'use client'

import { useState } from 'react'
import Link from 'next/link'

interface UserStats {
  level: number
  experience: number
  totalGames: number
  wins: number
  losses: number
  kills: number
  deaths: number
  accuracy: number
  rank: string
}

interface Achievement {
  id: string
  nama: string
  deskripsi: string
  icon: string
  unlocked: boolean
  progress: number
  maxProgress: number
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'history'>('overview')
  
  const userStats: UserStats = {
    level: 25,
    experience: 12500,
    totalGames: 156,
    wins: 89,
    losses: 67,
    kills: 342,
    deaths: 198,
    accuracy: 78.5,
    rank: 'Elite Sniper'
  }

  const achievements: Achievement[] = [
    {
      id: '1',
      nama: 'First Blood',
      deskripsi: 'Dapatkan kill pertama',
      icon: '🩸',
      unlocked: true,
      progress: 1,
      maxProgress: 1
    },
    {
      id: '2',
      nama: 'Sharpshooter',
      deskripsi: 'Tembak 100 target dengan akurasi 80%+',
      icon: '🎯',
      unlocked: false,
      progress: 67,
      maxProgress: 100
    },
    {
      id: '3',
      nama: 'Survivor',
      deskripsi: 'Bertahan hidup 10 menit tanpa mati',
      icon: '🛡️',
      unlocked: true,
      progress: 10,
      maxProgress: 10
    },
    {
      id: '4',
      nama: 'Team Player',
      deskripsi: 'Menang 50 game tim',
      icon: '👥',
      unlocked: false,
      progress: 32,
      maxProgress: 50
    },
    {
      id: '5',
      nama: 'Veteran',
      deskripsi: 'Main 100 game',
      icon: '🏆',
      unlocked: true,
      progress: 156,
      maxProgress: 100
    }
  ]

  const winRate = ((userStats.wins / userStats.totalGames) * 100).toFixed(1)
  const kdRatio = (userStats.kills / userStats.deaths).toFixed(2)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-white hover:text-blue-400 transition-colors">
            ← Kembali ke Home
          </Link>
          <h1 className="text-3xl font-bold text-glow">Profile</h1>
          <button className="btn-secondary text-sm px-4 py-2">
            Edit Profile
          </button>
        </div>

        {/* Profile Card */}
        <div className="card mb-8">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                AR
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold">
                {userStats.level}
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">Player123</h2>
              <p className="text-gray-400 mb-2">{userStats.rank}</p>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(userStats.experience % 1000) / 10}%` }}
                ></div>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                XP: {userStats.experience.toLocaleString()} / {(userStats.level + 1) * 1000}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'achievements', label: 'Achievements', icon: '🏆' },
            { id: 'history', label: 'History', icon: '📜' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card text-center">
              <div className="text-3xl mb-2">🎮</div>
              <div className="text-2xl font-bold text-white">{userStats.totalGames}</div>
              <div className="text-gray-400">Total Games</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-2xl font-bold text-white">{winRate}%</div>
              <div className="text-gray-400">Win Rate</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl mb-2">💀</div>
              <div className="text-2xl font-bold text-white">{kdRatio}</div>
              <div className="text-gray-400">K/D Ratio</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-2xl font-bold text-white">{userStats.accuracy}%</div>
              <div className="text-gray-400">Accuracy</div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id}
                className={`card ${achievement.unlocked ? 'border-green-500' : 'border-gray-600'}`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`text-3xl ${achievement.unlocked ? 'opacity-100' : 'opacity-50'}`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold ${achievement.unlocked ? 'text-white' : 'text-gray-400'}`}>
                      {achievement.nama}
                    </h3>
                    <p className="text-gray-400 text-sm mb-2">{achievement.deskripsi}</p>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          achievement.unlocked 
                            ? 'bg-green-500' 
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      {achievement.progress}/{achievement.maxProgress}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="card">
            <h3 className="text-xl font-bold text-white mb-4">Game History</h3>
            <div className="space-y-4">
              {[
                { mode: 'Team Deathmatch', result: 'Win', score: '15-12', date: '2025-01-05' },
                { mode: 'Capture The Flag', result: 'Loss', score: '8-10', date: '2025-01-04' },
                { mode: 'Survival', result: 'Win', score: '1st Place', date: '2025-01-03' },
                { mode: 'Team Deathmatch', result: 'Win', score: '20-15', date: '2025-01-02' },
                { mode: 'Free For All', result: 'Loss', score: '3rd Place', date: '2025-01-01' }
              ].map((game, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      game.result === 'Win' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <div className="text-white font-semibold">{game.mode}</div>
                      <div className="text-gray-400 text-sm">{game.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      game.result === 'Win' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {game.result}
                    </div>
                    <div className="text-gray-400 text-sm">{game.score}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 