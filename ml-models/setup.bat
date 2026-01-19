@echo off
REM Quick Start Script for ML Models (Windows)

setlocal enabledelayedexpansion

echo 🚀 CampusCare ML Models - Quick Start
echo =====================================
echo.

REM Check Python
echo ✓ Checking Python version...
python --version
echo.

REM Create venv
echo ✓ Creating virtual environment...
if not exist "venv" (
    python -m venv venv
    echo   Created: venv\
) else (
    echo   Already exists: venv\
)
echo.

REM Activate venv
echo ✓ Activating virtual environment...
call venv\Scripts\activate.bat
echo.

REM Install dependencies
echo ✓ Installing dependencies...
pip install -q -r requirements.txt
echo   Installed from requirements.txt
echo.

REM Create .env if not exists
echo ✓ Checking environment configuration...
if not exist ".env" (
    copy .env.example .env
    echo   Created: .env (please edit with your settings^)
) else (
    echo   Already exists: .env
)
echo.

REM Create models directory
echo ✓ Creating models directory...
if not exist "models" mkdir models
echo.

REM Create logs directory
echo ✓ Creating logs directory...
if not exist "logs" mkdir logs
echo.

echo ✅ Setup Complete!
echo.
echo 📝 Next Steps:
echo   1. Edit .env with your database configuration
echo   2. Run: python train_failure_model.py
echo   3. Run: python api_integration.py
echo.
echo 📚 Documentation:
echo   - README.md - Overview and usage
echo   - DEPLOYMENT.md - Production deployment guide
echo.

pause
