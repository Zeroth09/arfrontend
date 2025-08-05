# 🎮 Airsoft AR - Battle Proximity

Frontend untuk game PVP airsoft augmented reality 5v5 yang seru dan menantang! Dibangun dengan Next.js 15, TypeScript, dan Tailwind CSS.

## ✨ Fitur Utama

- **⚔️ 5v5 Team Deathmatch**: Tim Merah vs Tim Putih dalam pertempuran sengit
- **⏱️ 5 Menit Battle**: Waktu pertempuran yang singkat dan intens
- **🎯 Eliminasi Total**: Tim yang menghabiskan lawan atau sisa terbanyak menang
- **🎮 Game Master Control**: Kontrol game, pause, dan spectator mode
- **📊 Real-time Monitoring**: Status server dan live tracking
- **📱 Responsive Design**: UI yang modern dan aesthetic untuk semua device

## 🚀 Tech Stack

- **Framework**: Next.js 15 dengan App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: React Hooks
- **API**: RESTful API dengan WebSocket untuk real-time
- **Backend**: [Battle Proximity Server API](https://backend-production-9ccf.up.railway.app/)

## 🎮 Game Flow

1. **Input Nama & Pilih Tim** → Masukkan nama dan pilih Tim Merah atau Tim Putih
2. **Lobby** → Menunggu pemain bergabung (minimal 5 per tim)
3. **Game Start** → Game Master memulai pertempuran 5v5
4. **5 Menit Battle** → Eliminasi total dalam waktu 5 menit
5. **Winner** → Tim dengan sisa pemain terbanyak menang

## 📁 Struktur Project

```
src/
├── app/                    # App Router pages
│   ├── game-master/       # Game Master dashboard
│   ├── game/              # AR Game interface
│   ├── lobby/             # Game lobby
│   ├── status/            # Server status
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page (input nama & tim)
├── components/            # Reusable components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   └── index.ts
├── lib/                   # Utilities & API
│   ├── api.ts            # API functions
│   └── utils.ts          # Utility functions
└── types/                # TypeScript interfaces
    └── index.ts
```

## 🎯 Game Rules

### Objective
- Eliminasi total tim lawan dalam 5 menit
- Tim dengan sisa pemain terbanyak menang jika waktu habis
- Setiap pemain memiliki 1 nyawa

### Gameplay
- **5v5 Team Deathmatch**
- **Waktu**: 5 menit
- **Lokasi**: AR Battle Arena
- **Weapons**: Airsoft guns
- **Teams**: Tim Merah (Attack) vs Tim Putih (Defense)

## 🛠️ Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/Zeroth09/arfrontend.git
   cd arfrontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   ```
   http://localhost:3000
   ```

## 🔧 Scripts

- `npm run dev` - Development server
- `npm run build` - Build production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🎮 Pages

### 1. Home Page (`/`)
- Input nama pemain
- Pilih tim (Merah/Putih)
- Server status indicator
- Game rules overview

### 2. Lobby (`/lobby`)
- Menunggu pemain bergabung
- Team display (Merah vs Putih)
- Player count (5/5 per tim)
- Game Master controls
- Start game button

### 3. Game (`/game`)
- AR camera interface
- Real-time player tracking
- 5-minute countdown timer
- Health & ammo HUD
- Map view
- Inventory system
- Game over modal

### 4. Game Master (`/game-master`)
- Game controls (Start/Pause/Stop)
- Player management
- Live battle map
- Spectator mode
- Quick actions
- Real-time statistics

### 5. Status (`/status`)
- Server health monitoring
- API endpoints status
- System metrics
- Network status
- Recent events log

## 🌐 API Endpoints

Backend API tersedia di: `https://backend-production-9ccf.up.railway.app/`

### Game
- `GET /game/rooms` - Get all game rooms
- `POST /game/rooms` - Create new room
- `POST /game/rooms/:id/join` - Join room
- `POST /game/rooms/:id/leave` - Leave room
- `GET /game/rooms/:id/state` - Get game state

### Game Master
- `POST /game/start` - Start game
- `POST /game/pause` - Pause game
- `POST /game/stop` - Stop game
- `GET /game/players` - Get all players
- `GET /game/spectator` - Spectator mode

### Status
- `GET /health` - Server health
- `GET /status` - Detailed status
- `GET /metrics` - System metrics

## 🎨 UI Components

### Button
```tsx
import { Button } from '@/components'

<Button variant="primary" size="lg">
  Mulai Bermain
</Button>
```

### Card
```tsx
import { Card } from '@/components'

<Card variant="glass" hover>
  Content here
</Card>
```

### Modal
```tsx
import { Modal } from '@/components'

<Modal isOpen={showModal} onClose={() => setShowModal(false)}>
  Modal content
</Modal>
```

### Input
```tsx
import { Input } from '@/components'

<Input 
  label="Nama Pemain"
  placeholder="Masukkan nama kamu"
  icon={<UserIcon />}
/>
```

## 🎯 Game Features

### Real-time Battle
- WebSocket connection untuk update real-time
- Player position tracking
- Health & ammo system
- Team-based gameplay (Merah vs Putih)

### AR Interface
- Camera view dengan grid overlay
- Player markers dengan health bars
- Inventory system
- Map view dengan player positions

### Game Master Controls
- Start/Pause/Stop game
- Player monitoring
- Spectator mode
- Live camera feeds
- Emergency controls

## 📱 Responsive Design

- **Mobile**: Touch-friendly controls
- **Tablet**: Optimized layout
- **Desktop**: Full feature access

## 🎨 Design System

### Colors
- **Primary**: Blue gradient (`#3B82F6` to `#8B5CF6`)
- **Teams**: Red (`#EF4444`) and White (`#FFFFFF`)
- **Success**: Green (`#10B981`)
- **Warning**: Yellow (`#F59E0B`)
- **Error**: Red (`#EF4444`)

### Typography
- Font: Inter (Google Fonts)
- Headings: Bold weights
- Body: Regular weights

### Spacing
- Consistent 4px grid system
- Responsive padding/margins

## 🔒 Security

- Secure API calls
- Input validation
- XSS protection
- Rate limiting

## 🚀 Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically

### Manual Deployment
```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👥 Team

- **Developer**: [Zeroth09](https://github.com/Zeroth09)
- **Backend**: [Battle Proximity Server](https://backend-production-9ccf.up.railway.app/)

## 🎮 Live Demo

Visit: [airsoftar.vercel.app](https://airsoftar.vercel.app)

---

**Made with ❤️ for the Airsoft AR community**
