-- CampusCare Database Schema
-- PostgreSQL with PostGIS Extension

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enumerations
CREATE TYPE issue_category AS ENUM (
  'WATER',
  'ELECTRICITY',
  'WIFI',
  'SANITATION',
  'CROWDING',
  'TEMPERATURE',
  'OTHER'
);

CREATE TYPE issue_status AS ENUM (
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED'
);

-- Buildings Table
CREATE TABLE buildings (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location GEOGRAPHY(POINT) NOT NULL,
  address TEXT,
  building_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for buildings
CREATE INDEX idx_buildings_location ON buildings USING GIST(location);

-- Issues Table
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category issue_category NOT NULL,
  location GEOGRAPHY(POINT) NOT NULL,
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),
  status issue_status NOT NULL DEFAULT 'OPEN',
  description TEXT,
  building_id VARCHAR(50) REFERENCES buildings(id) ON DELETE SET NULL,
  reported_by VARCHAR(255),
  assigned_to VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  metadata JSONB
);

-- Create indexes for issues
CREATE INDEX idx_issues_location ON issues USING GIST(location);
CREATE INDEX idx_issues_category ON issues(category);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_severity ON issues(severity);
CREATE INDEX idx_issues_created_at ON issues(created_at DESC);
CREATE INDEX idx_issues_building_id ON issues(building_id);

-- Issue History Table (for tracking updates)
CREATE TABLE issue_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  field_name VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by VARCHAR(255),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_issue_history_issue_id ON issue_history(issue_id);
CREATE INDEX idx_issue_history_changed_at ON issue_history(changed_at DESC);

-- Zones Table (for grouping areas)
CREATE TABLE zones (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  boundary GEOGRAPHY(POLYGON) NOT NULL,
  zone_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_zones_boundary ON zones USING GIST(boundary);

-- Risk Scores Table
CREATE TABLE risk_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id VARCHAR(50) REFERENCES zones(id) ON DELETE CASCADE,
  building_id VARCHAR(50) REFERENCES buildings(id) ON DELETE CASCADE,
  category issue_category,
  risk_score DECIMAL(5,2) NOT NULL CHECK (risk_score BETWEEN 0 AND 10),
  recurrence_probability DECIMAL(5,4) CHECK (recurrence_probability BETWEEN 0 AND 1),
  issue_count INTEGER DEFAULT 0,
  avg_severity DECIMAL(3,2),
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_zone_or_building CHECK (
    (zone_id IS NOT NULL AND building_id IS NULL) OR
    (zone_id IS NULL AND building_id IS NOT NULL)
  )
);

CREATE INDEX idx_risk_scores_zone_id ON risk_scores(zone_id);
CREATE INDEX idx_risk_scores_building_id ON risk_scores(building_id);
CREATE INDEX idx_risk_scores_category ON risk_scores(category);
CREATE INDEX idx_risk_scores_calculated_at ON risk_scores(calculated_at DESC);

-- AI Insights Table
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query TEXT NOT NULL,
  insight TEXT NOT NULL,
  recommendations JSONB,
  data_points JSONB,
  generated_by VARCHAR(50) DEFAULT 'gemini',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_insights_created_at ON ai_insights(created_at DESC);

-- Reports Table
CREATE TABLE reports (
  id VARCHAR(50) PRIMARY KEY,
  report_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  content JSONB NOT NULL,
  start_date DATE,
  end_date DATE,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reports_report_type ON reports(report_type);
CREATE INDEX idx_reports_generated_at ON reports(generated_at DESC);

-- Users Table (for authentication tracking)
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_buildings_updated_at
  BEFORE UPDATE ON buildings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zones_updated_at
  BEFORE UPDATE ON zones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Functions for spatial queries

-- Function to find issues within a radius (in meters)
CREATE OR REPLACE FUNCTION find_issues_within_radius(
  center_lat DECIMAL,
  center_lng DECIMAL,
  radius_meters INTEGER
)
RETURNS TABLE (
  issue_id UUID,
  category issue_category,
  severity INTEGER,
  status issue_status,
  distance_meters DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.category,
    i.severity,
    i.status,
    ST_Distance(
      i.location::geography,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
    ) as distance_meters
  FROM issues i
  WHERE ST_DWithin(
    i.location,
    ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
    radius_meters
  )
  ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;

-- Function to get issue density by zone
CREATE OR REPLACE FUNCTION get_issue_density_by_zone()
RETURNS TABLE (
  zone_id VARCHAR,
  zone_name VARCHAR,
  issue_count BIGINT,
  avg_severity DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    z.id,
    z.name,
    COUNT(i.id),
    AVG(i.severity)
  FROM zones z
  LEFT JOIN issues i ON ST_Within(i.location, z.boundary)
  GROUP BY z.id, z.name
  ORDER BY COUNT(i.id) DESC;
END;
$$ LANGUAGE plpgsql;

-- Sample Data Insertion (Optional for testing)
-- INSERT INTO buildings (id, name, location, address) VALUES
-- ('BLDG-101', 'Engineering Building', ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326), '123 Campus Dr'),
-- ('BLDG-102', 'Science Hall', ST_SetSRID(ST_MakePoint(-74.0070, 40.7138), 4326), '456 University Ave');
