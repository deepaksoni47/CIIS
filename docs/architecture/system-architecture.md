# CampusCare System Architecture

## Overview

The CampusCare follows a modern cloud-native architecture designed for scalability, maintainability, and real-time performance.

## Architecture Layers

### 1. Presentation Layer

**Components:**

- React.js SPA with TypeScript
- Google Maps JavaScript API for geospatial visualization
- Responsive UI with Material-UI/Tailwind CSS

**Responsibilities:**

- User interaction and input validation
- Real-time map visualization with heatmap overlays
- Dashboard analytics and reporting
- Admin interface for issue management

### 2. Application Layer

**Components:**

- Node.js/Express REST API
- TypeScript for type safety
- Deployed on Google Cloud Run

**Responsibilities:**

- Business logic processing
- Request validation and authentication
- Data aggregation and transformation
- API endpoint management

**Key Modules:**

- **Issues Module**: CRUD operations for infrastructure issues
- **Analytics Module**: Trend analysis and statistical aggregation
- **AI Module**: Integration with Gemini API for insights
- **Auth Module**: Firebase Authentication integration

### 3. Data Layer

**Primary Database: Cloud SQL (PostgreSQL + PostGIS)**

- Stores operational data (issues, users, buildings)
- Spatial queries for geographic analysis
- ACID compliance for transactional integrity

**Analytics Database: BigQuery**

- Historical data warehouse
- Time-series analysis
- Complex analytical queries
- Integration with Looker Studio

**Schema Design:**

```sql
-- Issues Table
CREATE TABLE issues (
  id UUID PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  location GEOGRAPHY(POINT) NOT NULL,
  severity INTEGER CHECK (severity BETWEEN 1 AND 5),
  status VARCHAR(20) NOT NULL,
  description TEXT,
  building_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Spatial Index
CREATE INDEX idx_issues_location ON issues USING GIST(location);
```

### 4. Intelligence Layer

**Components:**

- **Vertex AI**: Predictive risk scoring
- **Gemini API**: Natural language insights and report generation

**Capabilities:**

- Risk score calculation based on historical patterns
- Recurrence probability estimation
- Plain-English insight generation
- Automated report summarization

### 5. Integration Layer

**External Services:**

- Firebase Authentication
- Firebase Cloud Messaging (optional)
- Google Cloud Storage (for file uploads)
- Looker Studio (for dashboards)

## Data Flow

### Issue Submission Flow

```
User Input → Frontend Validation → Backend API →
Database Insert → BigQuery Sync → Analytics Processing
```

### Heatmap Visualization Flow

```
User Request → Backend API → Spatial Query (PostGIS) →
Data Aggregation → Frontend Map Rendering
```

### AI Insight Generation Flow

```
Admin Request → Backend API → BigQuery Analytics →
Gemini API Processing → Insight Generation →
Response to Admin
```

## Deployment Architecture

### Development Environment

- Docker Compose for local services
- Hot-reload for rapid development
- Local PostgreSQL with PostGIS

### Production Environment

- **Frontend**: Firebase Hosting or Cloud Storage + CDN
- **Backend**: Cloud Run (serverless containers)
- **Database**: Cloud SQL with automated backups
- **Analytics**: BigQuery with scheduled queries
- **CI/CD**: Cloud Build with automated testing

## Security Architecture

### Authentication Flow

```
User → Firebase Auth → JWT Token → Backend Verification →
Protected Resource Access
```

### Security Measures

- JWT-based authentication
- Rate limiting on API endpoints
- SQL injection prevention via Prisma ORM
- Input validation and sanitization
- HTTPS/TLS encryption
- Environment variable encryption

## Scalability Considerations

### Horizontal Scaling

- Cloud Run auto-scaling based on traffic
- Read replicas for database scaling
- CDN caching for frontend assets

### Performance Optimization

- Database indexing (spatial and temporal)
- Query optimization with BigQuery
- Caching layer with Redis (future enhancement)
- Lazy loading for map data

### High Availability

- Multi-zone deployment
- Automated health checks
- Database backups and point-in-time recovery
- Load balancing with Cloud Load Balancer

## Monitoring and Observability

### Metrics

- API response times
- Database query performance
- Error rates and exceptions
- User engagement analytics

### Tools

- Cloud Logging for centralized logs
- Cloud Monitoring for metrics and alerting
- Sentry for error tracking (optional)
- Looker Studio for business intelligence

## Future Enhancements

1. **IoT Integration**: Real-time sensor data ingestion
2. **Mobile Applications**: Native iOS/Android apps
3. **Real-time Notifications**: WebSocket-based alerts
4. **Multi-tenancy**: Support for multiple campuses
5. **Advanced ML Models**: Custom predictive models with Vertex AI
6. **GraphQL API**: Alternative to REST for flexible queries
