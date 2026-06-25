# NORTH PROD — Backend API

> Node.js + Express + MongoDB (JavaScript) — Production Sound & Image Studio Platform

## Stack
- **Runtime**: Node.js 20+
- **Framework**: Express 4
- **Database**: MongoDB + Mongoose 8
- **Auth**: JWT (access + refresh tokens)
- **Real-time**: Socket.io 4
- **File uploads**: Multer (up to 2GB)
- **Email**: Nodemailer
- **Validation**: express-validator
- **Security**: Helmet, express-rate-limit, bcryptjs

## Quick Start

```bash
cd northprod-api
npm install
cp .env.example .env      # fill in your values
node src/utils/seeder.js  # seed admin user + services
npm run dev               # start with nodemon
```

API will be available at `http://localhost:5000`

## API Endpoints

### Auth — `/api/auth`
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/register` | Artist registration |
| POST | `/verify-email` | Email verification |
| POST | `/login` | Login (returns JWT) |
| POST | `/refresh-token` | Refresh access token |
| POST | `/forgot-password` | Send reset email |
| POST | `/reset-password` | Reset password |
| POST | `/logout` | Logout (invalidate refresh token) |
| GET  | `/me` | Get current user |

### Users — `/api/users`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/me` | ✅ | Get own profile |
| PUT | `/me` | ✅ | Update profile |
| POST | `/me/avatar` | ✅ | Upload avatar |
| POST | `/me/cover` | ✅ | Upload cover image |
| PUT | `/me/password` | ✅ | Change password |
| GET | `/:id` | ✅ | Get public profile |

### Bookings — `/api/bookings`
| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | `/pricing` | ❌ | any | Get pricing table |
| GET | `/availability` | ✅ | any | Check date availability |
| POST | `/` | ✅ | artist | Create booking request |
| GET | `/` | ✅ | any | Get my bookings |
| GET | `/all` | ✅ | prod/admin | Get all bookings |
| GET | `/:id` | ✅ | any | Get booking detail |
| PUT | `/:id/status` | ✅ | prod/admin | Confirm or reject |
| DELETE | `/:id` | ✅ | artist | Cancel booking |

### Projects — `/api/projects`
| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | `/` | ✅ | any | Get my projects |
| GET | `/all` | ✅ | admin | Get all projects |
| GET | `/:id` | ✅ | any | Get project detail |
| PUT | `/:id/stage` | ✅ | prod/admin | Update stage |
| POST | `/:id/comment` | ✅ | prod/admin | Add engineer comment |
| PUT | `/:id/details` | ✅ | prod/admin | Update project info |

### Files — `/api/files`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/upload` | ✅ | Upload file to project (max 2GB) |
| GET | `/project/:projectId` | ✅ | List project files |
| GET | `/:id/versions` | ✅ | Get file version history |
| POST | `/:id/comment` | ✅ | Add comment to file |
| DELETE | `/:id` | ✅ | Soft-delete file |

### Messages — `/api/messages`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/threads` | ✅ | Get all conversations |
| GET | `/unread-count` | ✅ | Get unread message count |
| GET | `/thread/:userId` | ✅ | Get/create thread with user |
| GET | `/thread/:userId/messages` | ✅ | Get messages in thread |
| POST | `/` | ✅ | Send message (+ optional file) |

### Notifications — `/api/notifications`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | ✅ | Get notifications (paginated) |
| PUT | `/:id/read` | ✅ | Mark one as read |
| PUT | `/read-all` | ✅ | Mark all as read |
| DELETE | `/:id` | ✅ | Delete notification |

### Portfolio — `/api/portfolio`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | ❌ | List published items (filterable) |
| GET | `/:id` | ❌ | Get item detail |
| POST | `/` | admin | Create portfolio item |
| PUT | `/:id` | admin | Update item |
| DELETE | `/:id` | admin | Delete item |

### Services — `/api/services`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | ❌ | List active services |
| POST | `/` | admin | Create service |
| PUT | `/:id` | admin | Update service |
| DELETE | `/:id` | admin | Delete service |

### Hero Media — `/api/hero`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/active` | ❌ | Get active hero config |
| GET | `/` | admin | List all hero configs |
| POST | `/` | admin | Create hero (upload video or embed URL) |
| PUT | `/:id/activate` | admin | Set as active hero |
| PUT | `/:id` | admin | Update hero config |
| DELETE | `/:id` | admin | Delete hero |

### Admin — `/api/admin`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/stats` | admin | Dashboard statistics |
| GET | `/users` | admin | List all users |
| PUT | `/users/:id` | admin | Update user role/status |
| DELETE | `/users/:id` | admin | Delete user |

## Socket.io Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `message:send` | `{ toUserId, content }` | Send a message |
| `message:typing` | `{ toUserId }` | Typing indicator |
| `message:stop-typing` | `{ toUserId }` | Stop typing |
| `room:join` | `roomId` | Join a room |
| `room:leave` | `roomId` | Leave a room |

### Server → Client
| Event | Description |
|-------|-------------|
| `message:receive` | New message received |
| `message:typing` | Other user is typing |
| `message:stop-typing` | Other user stopped typing |
| `notification:new` | New notification |
| `booking:status-changed` | Booking confirmed/rejected |
| `project:updated` | Project stage updated |
| `file:uploaded` | New file in project |

## Project Structure

```
northprod-api/
├── server.js               # Entry point
├── src/
│   ├── app.js              # Express app setup
│   ├── config/
│   │   ├── db.js           # MongoDB connection
│   │   ├── socket.js       # Socket.io setup
│   │   └── multer.js       # File upload config
│   ├── models/             # Mongoose schemas
│   │   ├── User.js
│   │   ├── Booking.js
│   │   ├── Project.js
│   │   ├── File.js
│   │   ├── Message.js
│   │   ├── Notification.js
│   │   ├── Portfolio.js
│   │   └── Service.js      # Service + HeroMedia
│   ├── controllers/        # Business logic
│   ├── routes/             # Express routers
│   ├── middleware/
│   │   ├── auth.js         # JWT protect + authorize
│   │   ├── error.js        # Global error handler
│   │   └── validate.js     # express-validator runner
│   ├── services/
│   │   └── email.service.js  # Nodemailer templates
│   └── utils/
│       ├── jwt.utils.js    # Token helpers
│       └── seeder.js       # DB seed script
└── uploads/                # Local file storage
    ├── avatars/
    ├── covers/
    ├── projects/
    ├── messages/
    ├── portfolio/
    └── hero/
```

## Default Admin Credentials (after seeding)
```
Email:    admin@northprod.tn
Password: NorthProd2026!
```
> ⚠️ Change this password immediately in production.

## Environment Variables
See `.env.example` for all required variables.
