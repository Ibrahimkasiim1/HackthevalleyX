@echo off

REM Navigate to server directory
cd server

REM Check if .env file exists, if not create from example
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo Please edit server/.env file and add your GOOGLE_API_KEY
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo Installing server dependencies...
    npm install
)

REM Start the server
echo Starting NavSense server...
npm run dev