#!/bin/bash
# Quick Start Script for ML Models

set -e

echo "🚀 CampusCare ML Models - Quick Start"
echo "====================================="
echo ""

# Check Python
echo "✓ Checking Python version..."
python --version
echo ""

# Create venv
echo "✓ Creating virtual environment..."
if [ ! -d "venv" ]; then
    python -m venv venv
    echo "  Created: venv/"
else
    echo "  Already exists: venv/"
fi
echo ""

# Activate venv
echo "✓ Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows
    source venv/Scripts/activate
else
    # Linux/Mac
    source venv/bin/activate
fi
echo ""

# Install dependencies
echo "✓ Installing dependencies..."
pip install -q -r requirements.txt
echo "  Installed from requirements.txt"
echo ""

# Create .env if not exists
echo "✓ Checking environment configuration..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "  Created: .env (please edit with your settings)"
else
    echo "  Already exists: .env"
fi
echo ""

# Create models directory
echo "✓ Creating models directory..."
mkdir -p models
echo ""

# Create logs directory
echo "✓ Creating logs directory..."
mkdir -p logs
echo ""

echo "✅ Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo "  1. Edit .env with your database configuration"
echo "  2. Run: python train_failure_model.py"
echo "  3. Run: python api_integration.py"
echo ""
echo "📚 Documentation:"
echo "  - README.md - Overview and usage"
echo "  - DEPLOYMENT.md - Production deployment guide"
echo ""
