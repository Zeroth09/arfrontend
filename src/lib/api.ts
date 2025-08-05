import { ApiResponse, LoginRequest, RegisterRequest, AuthResponse, GameRoom, User, UserStats } from '@/types'

const API_BASE_URL = 'https://backendairsoftar-production.up.railway.app'

// Test API connection
export const testAPIConnection = async (): Promise<{ success: boolean; message: string; response?: unknown }> => {
  try {
    console.log('Testing API connection to:', API_BASE_URL)
    
    // Try multiple endpoints
    const endpoints = ['/', '/health', '/api/health', '/status']
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`)
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        console.log(`Endpoint ${endpoint} - Response status:`, response.status)
        
        if (response.ok) {
          const data = await response.json().catch(() => ({ message: 'OK' }))
          console.log(`Endpoint ${endpoint} - Response data:`, data)
          return {
            success: true,
            message: `API berhasil terkoneksi! (${endpoint})`,
            response: data
          }
        }
      } catch (endpointError) {
        console.log(`Endpoint ${endpoint} failed:`, endpointError)
        continue
      }
    }
    
    // If all endpoints fail, try a simple GET request
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('Final API Response status:', response.status)
    console.log('Final API Response headers:', response.headers)

    if (response.ok) {
      const data = await response.json().catch(() => ({ message: 'Server is running' }))
      console.log('Final API Response data:', data)
      return {
        success: true,
        message: 'API berhasil terkoneksi!',
        response: data
      }
    } else {
      const errorData = await response.text()
      console.log('API Error response:', errorData)
      return {
        success: false,
        message: `API Error: ${response.status} - ${errorData}`,
        response: errorData
      }
    }

    console.log('API Response status:', response.status)
    console.log('API Response headers:', response.headers)

    if (response.ok) {
      const data = await response.json()
      console.log('API Response data:', data)
      return {
        success: true,
        message: 'API berhasil terkoneksi!',
        response: data
      }
    } else {
      const errorData = await response.text()
      console.log('API Error response:', errorData)
      return {
        success: false,
        message: `API Error: ${response.status} - ${errorData}`,
        response: errorData
      }
    }
  } catch (error) {
    console.error('API Connection Error:', error)
    return {
      success: false,
      message: `Koneksi gagal: ${error instanceof Error ? error.message : 'Unknown error'}`,
      response: error
    }
  }
}

// Generic API call function
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = localStorage.getItem('auth_token')
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Terjadi kesalahan pada server')
    }

    return data
  } catch (error) {
    console.error('API Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Terjadi kesalahan pada network'
    }
  }
}

// Auth API functions
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    return apiCall<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  },

  register: async (userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    return apiCall<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  },

  logout: async (): Promise<ApiResponse<void>> => {
    return apiCall<void>('/auth/logout', {
      method: 'POST',
    })
  },

  refreshToken: async (): Promise<ApiResponse<AuthResponse>> => {
    return apiCall<AuthResponse>('/auth/refresh', {
      method: 'POST',
    })
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    return apiCall<User>('/auth/profile')
  },
}

// Game API functions
export const gameAPI = {
  getRooms: async (): Promise<ApiResponse<GameRoom[]>> => {
    return apiCall<GameRoom[]>('/game/rooms')
  },

  createRoom: async (roomData: Partial<GameRoom>): Promise<ApiResponse<GameRoom>> => {
    return apiCall<GameRoom>('/game/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    })
  },

  joinRoom: async (roomId: string): Promise<ApiResponse<GameRoom>> => {
    return apiCall<GameRoom>(`/game/rooms/${roomId}/join`, {
      method: 'POST',
    })
  },

  leaveRoom: async (roomId: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/game/rooms/${roomId}/leave`, {
      method: 'POST',
    })
  },

  getGameState: async (roomId: string): Promise<ApiResponse<unknown>> => {
    return apiCall<unknown>(`/game/rooms/${roomId}/state`)
  },

  updatePlayerPosition: async (
    roomId: string,
    position: { x: number; y: number; z?: number }
  ): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/game/rooms/${roomId}/position`, {
      method: 'PUT',
      body: JSON.stringify(position),
    })
  },

  shoot: async (
    roomId: string,
    targetId: string,
    weaponId: string
  ): Promise<ApiResponse<{ hit: boolean; damage: number }>> => {
    return apiCall<{ hit: boolean; damage: number }>(`/game/rooms/${roomId}/shoot`, {
      method: 'POST',
      body: JSON.stringify({ targetId, weaponId }),
    })
  },
}

// Stats API functions
export const statsAPI = {
  getUserStats: async (): Promise<ApiResponse<UserStats>> => {
    return apiCall<UserStats>('/stats/user')
  },

  getLeaderboard: async (): Promise<ApiResponse<unknown[]>> => {
    return apiCall<unknown[]>('/stats/leaderboard')
  },

  getAchievements: async (): Promise<ApiResponse<unknown[]>> => {
    return apiCall<unknown[]>('/stats/achievements')
  },

  getGameHistory: async (page = 1, limit = 10): Promise<ApiResponse<unknown>> => {
    return apiCall<unknown>(`/stats/history?page=${page}&limit=${limit}`)
  },
}

// Utility functions
export const apiUtils = {
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('auth_token')
    if (!token) return false
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 > Date.now()
    } catch {
      return false
    }
  },

  // Get user from token
  getUserFromToken: (): User | null => {
    const token = localStorage.getItem('auth_token')
    if (!token) return null
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.user || null
    } catch {
      return null
    }
  },

  // Set auth token
  setAuthToken: (token: string): void => {
    localStorage.setItem('auth_token', token)
  },

  // Remove auth token
  removeAuthToken: (): void => {
    localStorage.removeItem('auth_token')
  },

  // Handle API errors
  handleError: (error: unknown): string => {
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: { data?: { message?: string } } }).response
      if (response?.data?.message) {
        return response.data.message
      }
    }
    if (error instanceof Error) {
      return error.message
    }
    return 'Terjadi kesalahan yang tidak diketahui'
  },
}

// WebSocket connection for real-time game updates
export class GameWebSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor(private roomId: string, private onMessage: (data: unknown) => void) {}

  connect(): void {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      console.error('No auth token found')
      return
    }

    this.ws = new WebSocket(`${API_BASE_URL.replace('https', 'wss')}/game/${this.roomId}?token=${token}`)

    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.onMessage(data)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    this.ws.onclose = () => {
      console.log('WebSocket disconnected')
      this.attemptReconnect()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.connect()
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error('Max reconnection attempts reached')
    }
  }

  send(data: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
} 