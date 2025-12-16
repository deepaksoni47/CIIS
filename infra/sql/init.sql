-- Infrastructure SQL Initialization Script
-- PostgreSQL with PostGIS

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enumerations
DO $$ BEGIN
  CREATE TYPE issue_category AS ENUM (
    'WATER',
    'ELECTRICITY',
    'WIFI',
    'SANITATION',
    'CROWDING',
    'TEMPERATURE',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE issue_status AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Buildings Table
CREATE TABLE IF NOT EXISTS buildings (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location GEOGRAPHY(POINT) NOT NULL,
  address TEXT,
  building_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_buildings_location ON buildings USING GIST(location);

-- Issues Table
CREATE TABLE IF NOT EXISTS issues (
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

CREATE INDEX IF NOT EXISTS idx_issues_location ON issues USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_building_id ON issues(building_id);

-- Sample data insertion
INSERT INTO buildings (id, name, location, address) VALUES
  ('BLDG-101', 'Engineering Building', ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326), '123 Campus Drive'),
  ('BLDG-102', 'Science Hall', ST_SetSRID(ST_MakePoint(-74.0070, 40.7138), 4326), '456 University Avenue'),
  ('BLDG-103', 'Library', ST_SetSRID(ST_MakePoint(-74.0050, 40.7120), 4326), '789 Academic Way')
ON CONFLICT (id) DO NOTHING;

-- Create update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_buildings_updated_at ON buildings;
CREATE TRIGGER update_buildings_updated_at
  BEFORE UPDATE ON buildings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_issues_updated_at ON issues;
CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
