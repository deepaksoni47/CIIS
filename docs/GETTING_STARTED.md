# CampusCare Project Setup - Getting Started Guide

## Quick Start

### 1. Prerequisites Check

Ensure you have the following installed:

- Node.js (v18+)
- Docker Desktop
- Git
- Google Cloud SDK (for deployment)

### 2. Clone and Setup

```powershell
# Clone the repository
git clone <your-repo-url>
cd campuscare

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start with Docker Compose (Recommended)

```powershell
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

This will start:

- PostgreSQL database (port 5432)
- Backend API (port 3000)
- Frontend app (port 5173)
- pgAdmin (port 5050) - optional

### 4. Manual Setup (Alternative)

#### Backend Setup

```powershell
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npm run prisma:seed

# Start development server
npm run dev
```

#### Frontend Setup

```powershell
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/health
- **pgAdmin**: http://localhost:5050 (admin@campuscare.local / admin)

## Next Steps

1. **Configure Google Cloud Services**

   - Set up Cloud SQL instance
   - Create BigQuery dataset
   - Enable Vertex AI API
   - Get Gemini API key

2. **Configure Firebase**

   - Create Firebase project
   - Enable Authentication
   - Download service account key

3. **Update Environment Variables**

   - Add Google Cloud credentials
   - Add Firebase configuration
   - Add Google Maps API key

4. **Run Database Migrations**

   ```powershell
   cd backend
   npx prisma migrate deploy
   ```

5. **Explore the Documentation**
   - Architecture: `docs/architecture/system-architecture.md`
   - API Spec: `docs/api/api-spec.md`
   - Database Schema: `docs/data-model/schema.sql`

## Development Workflow

### Making Changes

1. Create a feature branch

   ```powershell
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and test locally

3. Run linting and tests

   ```powershell
   # Backend
   cd backend
   npm run lint
   npm test

   # Frontend
   cd frontend
   npm run lint
   npm test
   ```

4. Commit and push
   ```powershell
   git add .
   git commit -m "Description of changes"
   git push origin feature/your-feature-name
   ```

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running: `docker ps`
- Check DATABASE_URL in .env
- Ensure port 5432 is not in use

### Backend Not Starting

- Check Node.js version: `node --version`
- Clear node_modules: `Remove-Item -Recurse -Force node_modules; npm install`
- Check logs: `docker-compose logs backend`

### Frontend Build Errors

- Clear cache: `Remove-Item -Recurse -Force node_modules .vite; npm install`
- Check VITE_API_BASE_URL in .env

## Support

For issues or questions:

1. Check the documentation in `/docs`
2. Review existing GitHub issues
3. Create a new issue with detailed information
