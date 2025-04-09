# Audix - Real-time Spotify Clone

A full-stack music streaming application with real-time features.

## Deployment to Render

This project is configured for easy deployment to [Render](https://render.com/).

### Prerequisites

1. A Render account
2. MongoDB Atlas database
3. Clerk account for authentication
4. Cloudinary account for media storage

### Deployment Steps

1. **Fork or clone this repository**

2. **Set up your environment variables in Render**

   The following environment variables need to be set in Render's dashboard:

   - `MONGODB_URI`: Your MongoDB connection string
   - `CLERK_SECRET_KEY`: Your Clerk secret key
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY`: Your Cloudinary API key
   - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
   - `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key

3. **Deploy using the render.yaml Blueprint**

   - Log in to your Render dashboard
   - Go to "Blueprints" section
   - Click "New Blueprint Instance"
   - Connect your repository
   - Render will detect the `render.yaml` file and configure the services
   - Review the settings and click "Apply"

4. **Verify Deployment**

   - Once deployed, you can access your application at:
     - Frontend: https://audix-web.onrender.com
     - Backend API: https://audix-api.onrender.com

## Local Development

1. Clone the repository
2. Copy `.env.sample` to `.env` in both frontend and backend directories
3. Fill in your environment variables
4. Install dependencies:
   ```
   cd backend && npm install
   cd frontend && npm install
   ```
5. Start the development servers:

   ```
   # Terminal 1
   cd backend && npm run dev

   # Terminal 2
   cd frontend && npm run dev
   ```

6. Access the application at http://localhost:3000

## Technologies Used

- **Frontend**: React, TypeScript, Vite, TailwindCSS, Zustand
- **Backend**: Node.js, Express, MongoDB, Socket.io
- **Authentication**: Clerk
- **Media Storage**: Cloudinary
