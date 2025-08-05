// User types
export interface User {
  id: string
  nama: string
  username: string
  email: string
  level: number
  experience: number
  rank: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

// Game types
export interface GameRoom {
  id: string
  nama: string
  pemain: number
  maxPemain: number
  status: 'waiting' | 'playing' | 'finished'
  lokasi: string
  mode: GameMode
  createdBy: string
  createdAt: Date
  players: Player[]
}

export interface Player {
  id: string
  nama: string
  health: number
  ammo: number
  position: Position
  team: 'red' | 'blue'
  isEnemy: boolean
  kills: number
  deaths: number
  accuracy: number
}

export interface Position {
  x: number
  y: number
  z?: number
}

export interface GameState {
  status: 'waiting' | 'playing' | 'finished'
  timeLeft: number
  score: { red: number; blue: number }
  players: Player[]
  map: string
  mode: GameMode
}

export type GameMode = 'Team Deathmatch' | 'Capture The Flag' | 'Survival' | 'Free For All'

// Stats types
export interface UserStats {
  level: number
  experience: number
  totalGames: number
  wins: number
  losses: number
  kills: number
  deaths: number
  accuracy: number
  rank: string
  playTime: number
  favoriteMode: GameMode
}

export interface Achievement {
  id: string
  nama: string
  deskripsi: string
  icon: string
  unlocked: boolean
  progress: number
  maxProgress: number
  category: 'combat' | 'social' | 'exploration' | 'special'
  reward?: {
    type: 'xp' | 'item' | 'title'
    value: number | string
  }
}

// API types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  nama: string
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
  expiresAt: Date
}

// Game events
export interface GameEvent {
  type: 'player_join' | 'player_leave' | 'player_kill' | 'player_death' | 'game_start' | 'game_end'
  playerId?: string
  targetId?: string
  data?: unknown
  timestamp: Date
}

// Inventory types
export interface InventoryItem {
  id: string
  nama: string
  type: 'weapon' | 'equipment' | 'consumable' | 'cosmetic'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  icon: string
  quantity: number
  maxQuantity: number
  stats?: {
    damage?: number
    accuracy?: number
    range?: number
    reloadSpeed?: number
  }
}

// Leaderboard types
export interface LeaderboardEntry {
  rank: number
  user: User
  stats: UserStats
  score: number
}

// Notification types
export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  read: boolean
  createdAt: Date
}

// Settings types
export interface UserSettings {
  soundEnabled: boolean
  musicEnabled: boolean
  vibrationEnabled: boolean
  notificationsEnabled: boolean
  language: 'id' | 'en'
  theme: 'dark' | 'light' | 'auto'
  quality: 'low' | 'medium' | 'high'
} 