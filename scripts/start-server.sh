#!/bin/bash

# Navigate to server directory
cd server

# Check if .env file exists, if not create from example
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please edit server/.env file and add your GOOGLE_API_KEY"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d node_modules ]; then
    echo "Installing server dependencies..."
    npm install
fi

# Start the server
echo "Starting NavSense server..."
npm run dev