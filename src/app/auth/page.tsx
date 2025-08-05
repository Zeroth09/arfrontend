'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nama: '',
    username: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle authentication logic here
    console.log('Form submitted:', formData)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-gray-900 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-white">AR</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-glow mb-2">
            {isLogin ? 'Selamat Datang Kembali' : 'Bergabung dengan Kami'}
          </h1>
          <p className="text-gray-400">
            {isLogin ? 'Login ke akun Airsoft AR kamu' : 'Buat akun baru untuk mulai bermain'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-gray-300 mb-2">Nama Lengkap</label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Pilih username unik"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-gray-300 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Masukkan email"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Masukkan password"
              required
            />
          </div>

          {isLogin && (
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-gray-300 text-sm">Ingat saya</span>
              </label>
              <Link href="#" className="text-blue-400 hover:text-blue-300 text-sm">
                Lupa password?
              </Link>
            </div>
          )}

          <button
            type="submit"
            className="w-full btn-primary py-3 text-lg"
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        {/* Social Login */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">Atau</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center px-4 py-2 border border-gray-600 rounded-lg text-white hover:bg-gray-700 transition-colors">
              <span className="mr-2">📱</span>
              Google
            </button>
            <button className="flex items-center justify-center px-4 py-2 border border-gray-600 rounded-lg text-white hover:bg-gray-700 transition-colors">
              <span className="mr-2">📘</span>
              Facebook
            </button>
          </div>
        </div>

        {/* Toggle Login/Register */}
        <div className="mt-8 text-center">
          <p className="text-gray-400">
            {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-400 hover:text-blue-300 ml-1 font-semibold"
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            ← Kembali ke Home
          </Link>
        </div>
      </div>
    </div>
  )
} 