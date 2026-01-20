@echo off
REM CampusCare Quick Start Script for Windows
REM This script helps set up and run the development environment

setlocal enabledelayedexpansion

color 0A
cls

echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                   CampusCare Quick Start Setup                     ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

REM Check Docker installation
echo [*] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [X] Docker is not installed
    echo.
    echo Please install Docker from https://www.docker.com/
    pause
    exit /b 1
)
for /f "tokens=3" %%i in ('docker --version') do set DOCKER_VERSION=%%i
color 0A
echo [OK] Docker is installed (version %DOCKER_VERSION%)

REM Check Docker Compose installation
echo [*] Checking Docker Compose installation...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [X] Docker Compose is not installed
    echo.
    echo Please install Docker Compose from https://docs.docker.com/compose/install/
    pause
    exit /b 1
)
color 0A
echo [OK] Docker Compose is installed

REM Check if .env file exists
echo [*] Checking environment configuration...
if exist .env (
    color 0A
    echo [OK] .env file found
) else (
    color 0E
    echo [!] .env file not found, creating from template...
    if exist .env.docker.example (
        copy .env.docker.example .env >nul
        color 0A
        echo [OK] Created .env from template
        color 0E
        echo.
        echo [!] IMPORTANT: Please edit .env with your credentials:
        echo.
        echo Required environment variables:
        echo   - FIREBASE_PROJECT_ID
        echo   - FIREBASE_PRIVATE_KEY
        echo   - FIREBASE_CLIENT_EMAIL
        echo   - GOOGLE_GEMINI_API_KEY
        echo   - NEXT_PUBLIC_FIREBASE_API_KEY
        echo   - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
        echo   - NEXT_PUBLIC_FIREBASE_PROJECT_ID
        echo.
        pause
    ) else (
        color 0C
        echo [X] .env.docker.example not found!
        pause
        exit /b 1
    )
)

color 0A
echo.
echo Available options:
echo   1 - Start development environment
echo   2 - Start production environment
echo   3 - Stop all services
echo   4 - View service logs
echo   5 - Restart services
echo   6 - Check service health
echo   7 - Clean up all (WARNING: removes volumes!)
echo.
set /p option="Select option (1-7): "

if "%option%"=="1" (
    cls
    echo [*] Starting development environment...
    docker-compose up -d
    timeout /t 2 /nobreak
    cls
    color 0A
    echo [OK] Development services started!
    echo.
    echo Access URLs:
    echo   Frontend:  http://localhost:3000
    echo   Backend:   http://localhost:3001
    echo   ML API:    http://localhost:5000
    echo.
    echo [*] Waiting for services to be ready (this may take a minute)...
    timeout /t 5 /nobreak
    cls
    echo [*] Service status:
    docker-compose ps
    echo.
    pause
    echo [*] Viewing logs (close window to stop)...
    docker-compose logs -f
) else if "%option%"=="2" (
    cls
    echo [*] Starting production environment...
    docker-compose -f docker-compose.prod.yml up -d
    timeout /t 2 /nobreak
    cls
    color 0A
    echo [OK] Production services started!
    echo.
    echo [*] Service status:
    docker-compose -f docker-compose.prod.yml ps
    echo.
    pause
) else if "%option%"=="3" (
    cls
    echo [*] Stopping all services...
    docker-compose down
    timeout /t 2 /nobreak
    cls
    color 0A
    echo [OK] All services stopped!
    pause
) else if "%option%"=="4" (
    cls
    echo Available services:
    echo   1 - Frontend
    echo   2 - Backend
    echo   3 - ML API
    echo   4 - All services
    echo.
    set /p service_option="Select service (1-4): "
    
    if "!service_option!"=="1" (
        docker-compose logs -f frontend
    ) else if "!service_option!"=="2" (
        docker-compose logs -f backend
    ) else if "!service_option!"=="3" (
        docker-compose logs -f ml-api
    ) else if "!service_option!"=="4" (
        docker-compose logs -f
    ) else (
        color 0C
        echo [X] Invalid option
    )
) else if "%option%"=="5" (
    cls
    echo [*] Restarting services...
    docker-compose restart
    timeout /t 2 /nobreak
    cls
    color 0A
    echo [OK] Services restarted!
    echo.
    docker-compose ps
    pause
) else if "%option%"=="6" (
    cls
    echo [*] Checking service health...
    echo.
    echo Frontend health:
    docker-compose exec frontend curl http://localhost:3000 >nul 2>&1
    if %errorlevel% equ 0 (
        color 0A
        echo [OK] Frontend is healthy
    ) else (
        color 0C
        echo [X] Frontend is unhealthy
    )
    color 0A
    echo.
    echo Backend health:
    docker-compose exec backend curl http://localhost:3001/health >nul 2>&1
    if %errorlevel% equ 0 (
        color 0A
        echo [OK] Backend is healthy
    ) else (
        color 0C
        echo [X] Backend is unhealthy
    )
    color 0A
    echo.
    echo ML API health:
    docker-compose exec ml-api curl http://localhost:5000/api/ml/health >nul 2>&1
    if %errorlevel% equ 0 (
        color 0A
        echo [OK] ML API is healthy
    ) else (
        color 0C
        echo [X] ML API is unhealthy
    )
    color 0A
    echo.
    pause
) else if "%option%"=="7" (
    cls
    color 0E
    echo [!] This will remove all containers, images, and volumes!
    echo.
    set /p confirm="Are you sure? (type 'yes' to continue): "
    if /i "!confirm!"=="yes" (
        echo [*] Cleaning up...
        docker-compose down -v --rmi all
        timeout /t 2 /nobreak
        cls
        color 0A
        echo [OK] Cleanup complete!
    ) else (
        color 0E
        echo [!] Cleanup cancelled
    )
    pause
) else (
    color 0C
    echo [X] Invalid option
    pause
)

color 0A
echo.
echo [OK] Done!
pause
