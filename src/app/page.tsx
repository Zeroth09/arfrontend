'use client'

import { useState } from 'react'
import Link from 'next/link'

interface PlayerData {
  nama: string
  tim: 'merah' | 'putih' | null
}

export default function HomePage() {
  const [playerData, setPlayerData] = useState<PlayerData>({
    nama: '',
    tim: null
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!playerData.nama || !playerData.tim) return
    
    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      // Store player data in localStorage
      localStorage.setItem('playerData', JSON.stringify(playerData))
      setIsSubmitting(false)
      // Redirect to lobby
      window.location.href = '/lobby'
    }, 1000)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerData({
      ...playerData,
      nama: e.target.value
    })
  }

  const handleTeamSelect = (tim: 'merah' | 'putih') => {
    setPlayerData({
      ...playerData,
      tim
    })
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background dengan efek parallax */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-20"></div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center slide-in">
          {/* Logo dan judul */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-2 bg-gray-900 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">AR</span>
              </div>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold text-glow mb-4">
              Airsoft AR
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Battle Proximity - 5v5 Team Deathmatch
            </p>
          </div>

          {/* Status server */}
          <div className="card max-w-md mx-auto mb-8">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-semibold">Server Online</span>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              https://backend-production-9ccf.up.railway.app/
            </p>
          </div>

          {/* Player Registration Form */}
          <div className="card max-w-md mx-auto mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Bergabung ke Pertempuran</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nama Input */}
              <div>
                <label className="block text-gray-300 mb-2 text-left">Nama Pemain</label>
                <input
                  type="text"
                  value={playerData.nama}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Masukkan nama kamu"
                  required
                  maxLength={20}
                />
              </div>

              {/* Team Selection */}
              <div>
                <label className="block text-gray-300 mb-4 text-left">Pilih Tim</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleTeamSelect('merah')}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                      playerData.tim === 'merah'
                        ? 'border-red-500 bg-red-500/20 text-red-400'
                        : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-red-500 hover:bg-red-500/10'
                    }`}
                  >
                    <div className="text-2xl mb-2">🔴</div>
                    <div className="font-bold">Tim Merah</div>
                    <div className="text-sm opacity-75">Attack Team</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleTeamSelect('putih')}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                      playerData.tim === 'putih'
                        ? 'border-white bg-white/20 text-white'
                        : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-white hover:bg-white/10'
                    }`}
                  >
                    <div className="text-2xl mb-2">⚪</div>
                    <div className="font-bold">Tim Putih</div>
                    <div className="text-sm opacity-75">Defense Team</div>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!playerData.nama || !playerData.tim || isSubmitting}
                className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Bergabung...
                  </>
                ) : (
                  '🎮 Bergabung ke Pertempuran'
                )}
              </button>
            </form>
          </div>

          {/* Game Rules */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="card text-center">
              <div className="text-4xl mb-4">⚔️</div>
              <h3 className="text-xl font-bold text-white mb-2">5v5 Battle</h3>
              <p className="text-gray-300">Tim Merah vs Tim Putih dalam pertempuran sengit</p>
            </div>
            <div className="card text-center">
              <div className="text-4xl mb-4">⏱️</div>
              <h3 className="text-xl font-bold text-white mb-2">5 Menit</h3>
              <p className="text-gray-300">Waktu pertempuran yang singkat dan intens</p>
            </div>
            <div className="card text-center">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-bold text-white mb-2">Eliminasi Total</h3>
              <p className="text-gray-300">Tim yang menghabiskan lawan atau sisa terbanyak menang</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 Airsoft AR - Battle Proximity Game
            </p>
            <div className="flex justify-center space-x-4 mt-4">
              <a href="https://github.com/Zeroth09/arfrontend.git" className="text-blue-400 hover:text-blue-300 transition-colors">
                GitHub
              </a>
              <span className="text-gray-600">|</span>
              <Link href="/game-master" className="text-blue-400 hover:text-blue-300 transition-colors">
                Game Master
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 