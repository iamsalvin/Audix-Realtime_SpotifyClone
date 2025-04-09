# Audix - Real-time Spotify Clone

Audix is a full-featured music streaming platform that emulates Spotify's core functionality with real-time interactive features. The platform offers a premium subscription model, music playback, user activity tracking, and a social component with real-time chat and notifications.

![Audix Platform](https://github.com/iamsalvin/Audix-Realtime_SpotifyClone/raw/master/frontend/public/audix-banner.png)

## Features

### Audio Playback

- High-quality music streaming with reliable playback controls
- Support for continuous playback and auto-queue management
- Advanced playback controls (play/pause, skip, previous, volume adjustment)
- Error recovery with automatic retry mechanism

### User Experience

- Responsive design for all screen sizes
- Modern UI with animations and transitions
- Voice announcements for key events
- Optimized scrolling and navigation
- Real-time playback synchronization

### Premium Subscription

- Tiered subscription model (Basic, Standard, Premium)
- Payment processing system
- Premium-only features (unlimited skips, downloads, high-quality audio)
- Premium account management

### Social Features

- Real-time user activity tracking
- Friend activity display
- Chat system with real-time messaging
- User presence indicators

### Content Organization

- Song browsing and discovery
- Album grouping and navigation
- Search functionality with dynamic results
- Personalized recommendation engine

### User Management

- User authentication via Clerk
- Profile management
- Liked songs collection
- Play history tracking

## Technology Stack

### Frontend

- **React**: UI library for building interactive components
- **TypeScript**: Type-safe JavaScript for improved developer experience
- **Vite**: Fast build tool and development server
- **TailwindCSS**: Utility-first CSS framework for styling
- **Zustand**: State management for global application state
- **Radix UI**: Accessible UI component primitives
- **Framer Motion**: Animation library for smooth transitions
- **React Router**: Client-side routing
- **Axios**: HTTP client for API requests
- **Socket.io Client**: Real-time communication

### Backend

- **Node.js**: JavaScript runtime for server-side code
- **Express**: Web framework for building the API
- **MongoDB**: NoSQL database for data storage
- **Mongoose**: ODM for MongoDB
- **Socket.io**: Real-time bidirectional event-based communication
- **Clerk**: Authentication and user management
- **Cloudinary**: Cloud storage for media files
- **Node-cron**: Scheduled tasks and maintenance

## Project Structure

```
Audix/
├── frontend/                  # React frontend application
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── layout/            # Layout components
│   │   ├── lib/               # Utility functions and configurations
│   │   ├── pages/             # Application pages
│   │   ├── providers/         # Context providers
│   │   ├── stores/            # Zustand state stores
│   │   ├── hooks/             # Custom React hooks
│   │   ├── App.tsx            # Main application component
│   │   └── main.tsx           # Application entry point
│   ├── package.json           # Frontend dependencies
│   └── vite.config.ts         # Vite configuration
│
├── backend/                   # Node.js backend application
│   ├── src/
│   │   ├── controller/        # API controllers
│   │   ├── lib/               # Utility functions
│   │   ├── middleware/        # Express middleware
│   │   ├── models/            # Mongoose models
│   │   ├── routes/            # API routes
│   │   ├── seeds/             # Database seed scripts
│   │   └── index.js           # Server entry point
│   └── package.json           # Backend dependencies
```

## Setup and Installation

### Prerequisites

- Node.js 18+
- MongoDB database (local or MongoDB Atlas)
- Clerk account for authentication
- Cloudinary account for media storage

### Backend Setup

1. Navigate to the backend directory:

   ```
   cd backend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file with the following variables:

   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   ADMIN_EMAIL=your_admin_email
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   NODE_ENV=development
   CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   ```

4. Seed the database with sample data (optional):

   ```
   npm run seed:songs
   npm run seed:albums
   ```

5. Start the backend server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```
   cd frontend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file with the following variables:

   ```
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   ```

4. Start the frontend development server:

   ```
   npm run dev
   ```

5. Access the application at http://localhost:3001

## Key Features and Implementations

### Audio Player with Retry Mechanism

The audio player in Audix implements a robust retry mechanism to handle playback errors, ensuring a seamless listening experience. If playback fails, the system automatically attempts to restart playback up to three times with increasing delays between attempts.

### Voice Announcement System

Audix includes a voice announcement feature that uses the Web Speech API to provide audible notifications for important events, such as premium upgrades or special offers. This enhances accessibility and provides a more engaging user experience.

### Real-Time Activity Tracking

Using Socket.io, Audix tracks and displays user activities in real-time, allowing users to see what their friends are listening to and interact with them through the platform.

### Premium Subscription Model

The platform implements a tiered subscription model with different pricing levels and features. This is handled through an intuitive upgrade flow with payment processing and account management.

### Responsive Playback Controls

The playback controls are optimized for various devices with debounced interactions to prevent rapid-fire clicks and ensure smooth operation across different screen sizes and network conditions.

## Contributing

Contributions to Audix are welcome! Please feel free to submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Spotify for inspiration
- All the open-source libraries used in this project
- Contributors and supporters of the Audix project
