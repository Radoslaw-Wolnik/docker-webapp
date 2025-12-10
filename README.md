# Real-time Tic Tac Toe
A template for an app inside docker containers - real time tic tc toe with everything - db, cache, https proxy, user management

A full-stack, real-time Tic Tac Toe game built with modern web technologies.

## 🚀 Features

- **Real-time Gameplay**: Instant moves with WebSocket connections
- **User Authentication**: Sign up, login, or play as guest
- **Game Statistics**: Track wins, losses, and draws
- **Public & Private Games**: Join random games or create private games with codes
- **Responsive Design**: Play on desktop, tablet, or mobile
- **Game History**: Review your past games and performance
- **Player Profiles**: Customize your profile with avatars

## 🏗️ Tech Stack

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Cache/Queue**: Redis
- **Real-time**: Socket.io for WebSocket connections
- **Authentication**: JWT tokens with refresh token rotation
- **File Storage**: Local file system for avatars
- **Validation**: Express Validator

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand with persistence
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library with Lucide React icons
- **Real-time**: Socket.io client
- **Routing**: React Router DOM
- **HTTP Client**: Axios with interceptors
- **Notifications**: React Hot Toast

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx for frontend serving
- **Database**: MongoDB 7
- **Cache**: Redis 7

## 📁 Project Structure

```
docker-webapp/
├── .env                    # Environment variables
├── docker-compose.yml      # Multi-container orchestration
├── backend/
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── utils/          # Helper functions
│   │   └── index.ts        # App entry point
│   ├── Dockerfile          # Backend container definition
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── stores/         # Zustand stores
│   │   ├── api/            # API clients & WebSocket
│   │   ├── types/          # TypeScript definitions
│   │   └── main.tsx        # App entry point
│   ├── Dockerfile          # Frontend container definition
│   ├── nginx.conf          # Nginx configuration
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd docker-webapp
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env file with your preferences
   ```

3. **Build and run the application**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api
   - MongoDB: localhost:27017
   - Redis: localhost:6379

## 🛠️ Development

### Start Development Environment
```bash
docker-compose up
```

### Stop Services
```bash
docker-compose down
```

### Rebuild Containers
```bash
docker-compose up --build
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Clean Everything (including volumes)
```bash
docker-compose down -v
```

### Run Commands Inside Containers
```bash
# Backend container
docker-compose exec backend sh

# Frontend container
docker-compose exec frontend sh
```

## 🔧 Configuration

### Environment Variables
The application uses a single `.env` file at the root. Key variables include:

```bash
# Backend
PORT=3000
MONGO_URI=mongodb://mongodb:27017/tic-tac-toe
JWT_SECRET=your-secret-key

# Frontend
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```

### Game Settings
- **Game Code Length**: 6 characters
- **Max Game Duration**: 1 hour
- **Avatar File Size**: Max 5MB
- **Allowed Avatar Types**: JPEG, PNG, GIF

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/anonymous` - Create anonymous user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile

### Games
- `POST /api/games/create` - Create new game
- `POST /api/games/join` - Join game by code
- `GET /api/games/find` - Find random public game
- `POST /api/games/:gameId/move` - Make a move
- `GET /api/games/open/count` - Get count of open games

### Profile
- `GET /api/profile` - Get profile
- `PUT /api/profile` - Update profile
- `POST /api/profile/avatar` - Upload avatar
- `GET /api/profile/games/history` - Get game history

### WebSocket Events
- `join_game` - Join a game room
- `make_move` - Make a move in game
- `leave_game` - Leave game room
- `game_state` - Updated game state
- `move_made` - When a move is made
- `game_ended` - When game ends

## 🧪 Testing

### Running Tests
```bash
# Backend tests
docker-compose exec backend npm test

# Frontend tests
docker-compose exec frontend npm test
```

## 🐛 Troubleshooting

### Common Issues

1. **Containers won't start**
   ```bash
   # Check if ports are already in use
   docker-compose down
   sudo lsof -i :3000
   sudo lsof -i :5173
   sudo lsof -i :27017
   sudo lsof -i :6379
   ```

2. **MongoDB connection issues**
   ```bash
   # Check MongoDB logs
   docker-compose logs mongodb
   ```

3. **Frontend can't connect to backend**
   - Verify `.env` file has correct URLs
   - Check backend is running: `docker-compose ps`
   - Check network connectivity: `docker network ls`

4. **WebSocket connection issues**
   - Ensure WebSocket URL is correct in `.env`
   - Check if backend WebSocket server is running

### Docker Cleanup
```bash
# Remove all containers, networks, and volumes
docker system prune -a --volumes

# Remove specific images
docker rmi $(docker images -q)
```

## 📄 License

This project is licensed under the MIT License.

