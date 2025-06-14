# Chat App

A modern real-time chat application with authentication, real-time messaging, video calls, profile management, and OAuth integration.

![Chat App](frontend/public/icon.png)

## Features

- **Real-time Messaging** - Instant message delivery using Socket.IO
- **Video Calling** - One-to-one video calls with screen sharing capability
- **User Authentication** - Secure login, registration, and session management
- **OAuth Integration** - Support for Google and Facebook authentication
- **Call History** - Track and view past video call activity
- **Responsive Design** - Works on desktop and mobile devices
- **Theme Mode** - Theme customization for user preference

## Tech Stack

### Frontend
- React 19
- React Router v7
- Zustand for state management
- WebRTC for peer-to-peer video communication
- TailwindCSS with DaisyUI
- Socket.io client for real-time communication and signaling
- Tone.js for audio notifications
- Vite as build tool
- Axios for API requests

### Backend
- Express.js
- Socket.IO for real-time functionality and WebRTC signaling
- MongoDB with Mongoose
- JWT for authentication
- Passport.js for OAuth
- Cloudinary for image storage
- bcryptjs for password hashing

## Project Structure

```
chat-app/
├── backend/                # Express.js server
│   ├── src/
│   │   ├── controllers/    # Request controllers
│   │   ├── models/         # Mongoose data models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── lib/            # Utilities and configurations
│   │   └── seeds/          # Database seed data
│   └── package.json        # Backend dependencies
│
├── frontend/               # React application
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Application pages
│   │   ├── store/          # Zustand state stores
│   │   ├── lib/            # Utility functions
│   │   └── assets/         # Images and other assets
│   └── package.json        # Frontend dependencies
│
└── package.json            # Root package.json for scripts
```