# Docker Setup for Expense Tracker

This guide explains how to run the Expense Tracker app in a Docker container on your Mac Studio for 24/7 hosting.

## Prerequisites

- Docker Desktop installed on your Mac Studio
- Firebase project credentials

## Quick Start

1. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   Then edit `.env` and add your Firebase credentials.

2. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```
   
   Or use the convenient npm scripts:
   ```bash
   yarn docker:up
   ```

3. **Access the app:**
   - On your Mac Studio: `http://localhost:3000`
   - On other devices on your network: `http://YOUR_MAC_IP:3000`
   
   To find your Mac Studio's IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

## Manual Docker Commands

If you prefer not to use Docker Compose:

1. **Build the image:**
   ```bash
   docker build -t expense-tracker \
     --build-arg VITE_FIREBASE_API_KEY=your-key \
     --build-arg VITE_FIREBASE_AUTH_DOMAIN=your-domain \
     --build-arg VITE_FIREBASE_PROJECT_ID=your-id \
     --build-arg VITE_FIREBASE_STORAGE_BUCKET=your-bucket \
     --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id \
     --build-arg VITE_FIREBASE_APP_ID=your-app-id \
     .
   ```

2. **Run the container:**
   ```bash
   docker run -d -p 3000:80 --name expense-tracker --restart unless-stopped expense-tracker
   ```

## Managing the Container

Using npm scripts:
- **View logs:** `yarn docker:logs`
- **Restart:** `yarn docker:restart`
- **Start:** `yarn docker:up`
- **Stop:** `yarn docker:down`

Using Docker commands directly:
- **View logs:** `docker logs expense-tracker`
- **Restart:** `docker restart expense-tracker`
- **Stop:** `docker stop expense-tracker`
- **Start:** `docker start expense-tracker`

- **Update the app:**
  ```bash
  yarn docker:down
  docker-compose build --no-cache
  yarn docker:up
  ```

## Network Access

To access the app from other devices on your local network:

1. Make sure Docker Desktop is configured to use "0.0.0.0" for port binding (default behavior)
2. Find your Mac Studio's local IP address
3. Access via `http://YOUR_MAC_IP:3000`

## Security Notes

- This setup is for **local network use only**
- For external/public access, consider:
  - Adding SSL/TLS certificates (Let's Encrypt with Certbot)
  - Using a reverse proxy (e.g., Traefik, nginx)
  - Setting up proper firewall rules
  - Using a VPN for secure remote access

## Troubleshooting

- **Port already in use:** Change the port mapping in `docker-compose.yml` from `3000:80` to something like `8080:80`
- **Can't connect from other devices:** Check macOS firewall settings and ensure Docker Desktop network settings allow external connections
- **Build fails:** Make sure all Firebase environment variables are set correctly in your `.env` file

