import { firestore } from "firebase-admin";

/**
 * Issue Categories
 */
export enum IssueCategory {
  WATER = "WATER",
  ELECTRICITY = "ELECTRICITY",
  WIFI = "WIFI",
  SANITATION = "SANITATION",
  CROWDING = "CROWDING",
  TEMPERATURE = "TEMPERATURE",
  OTHER = "OTHER",
}

/**
 * Issue Status
 */
export enum IssueStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

/**
 * Building Document (Firestore)
 */
export interface Building {
  id: string;
  name: string;
  location: firestore.GeoPoint; // Firebase GeoPoint for geospatial queries
  address?: string;
  buildingType?: string;
  createdAt: firestore.Timestamp;
  updatedAt: firestore.Timestamp;
}

/**
 * Issue Document (Firestore)
 */
export interface Issue {
  id: string;
  category: IssueCategory;
  location: firestore.GeoPoint; // Firebase GeoPoint
  severity: number; // 1-10
  status: IssueStatus;
  description?: string;
  buildingId?: string;
  reportedBy?: string;
  assignedTo?: string;
  createdAt: firestore.Timestamp;
  updatedAt: firestore.Timestamp;
  resolvedAt?: firestore.Timestamp;
  metadata?: Record<string, any>;
}

/**
 * Issue History Document (Firestore)
 */
export interface IssueHistory {
  id: string;
  issueId: string;
  fieldName: string;
  oldValue?: string;
  newValue?: string;
  changedBy?: string;
  changedAt: firestore.Timestamp;
}

/**
 * Zone Document (Firestore)
 */
export interface Zone {
  id: string;
  name: string;
  boundary: firestore.GeoPoint[]; // Array of GeoPoints for polygon
  zoneType?: string;
  createdAt: firestore.Timestamp;
  updatedAt: firestore.Timestamp;
}

/**
 * Risk Score Document (Firestore)
 */
export interface RiskScore {
  id: string;
  buildingId?: string;
  zoneId?: string;
  category: IssueCategory;
  score: number; // 0-100
  calculatedAt: firestore.Timestamp;
  metadata?: {
    issueCount?: number;
    avgSeverity?: number;
    recentTrend?: string;
  };
}

/**
 * User Document (Firestore)
 */
export interface User {
  id: string; // Firebase Auth UID
  email: string;
  displayName?: string;
  role: "admin" | "staff" | "student";
  createdAt: firestore.Timestamp;
  lastLoginAt?: firestore.Timestamp;
  preferences?: {
    notifications?: boolean;
    emailAlerts?: boolean;
  };
}

/**
 * Analytics Event Document (Firestore)
 */
export interface AnalyticsEvent {
  id: string;
  eventType: string;
  category: IssueCategory;
  buildingId?: string;
  zoneId?: string;
  value?: number;
  timestamp: firestore.Timestamp;
  metadata?: Record<string, any>;
}
