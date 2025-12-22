import { firestore } from "firebase-admin";

/**
 * Organization/University entity (for multi-tenancy)
 */
export interface Organization {
  id: string;
  name: string;
  shortName: string; // e.g., "GGV"
  address: string;
  city: string;
  state: string;
  country: string;
  campusCenter: firestore.GeoPoint;
  campusBounds: {
    northWest: firestore.GeoPoint;
    northEast: firestore.GeoPoint;
    southWest: firestore.GeoPoint;
    southEast: firestore.GeoPoint;
  };
  contactEmail: string;
  contactPhone: string;
  website?: string;
  timezone: string;
  isActive: boolean;
  createdAt: firestore.Timestamp;
  updatedAt: firestore.Timestamp;
}

/**
 * Department entity
 */
export interface Department {
  id: string;
  organizationId: string;
  name: string;
  code: string; // e.g., "CSE", "EE", "ME"
  buildingId?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  createdAt: firestore.Timestamp;
  updatedAt: firestore.Timestamp;
}

/**
 * Building/Infrastructure entity
 */
export interface Building {
  id: string;
  organizationId: string;
  departmentId?: string;
  name: string;
  code: string;
  location: firestore.GeoPoint;
  address: string;
  buildingType: string;
  floors: number;
  totalArea?: number;
  constructionYear?: number;
  lastRenovation?: firestore.Timestamp;
  status: "active" | "under_maintenance" | "decommissioned";
  createdAt: firestore.Timestamp;
  updatedAt: firestore.Timestamp;
}

/**
 * Room entity
 */
export interface Room {
  id: string;
  organizationId: string;
  buildingId: string;
  departmentId?: string;
  roomNumber: string;
  floor: number;
  roomType:
    | "classroom"
    | "lab"
    | "office"
    | "auditorium"
    | "library"
    | "common"
    | "restroom"
    | "other";
  capacity?: number;
  area?: number;
  hasAC: boolean;
  hasProjector: boolean;
  status: "active" | "under_maintenance" | "closed";
  createdAt: firestore.Timestamp;
  updatedAt: firestore.Timestamp;
}

/**
 * Infrastructure Issue/Report
 */
export interface Issue {
  id: string;
  organizationId: string;
  campusId?: string; // Campus identifier (optional)
  buildingId: string;
  departmentId?: string;
  roomId?: string;
  title: string;
  description: string;
  category:
    | "Structural"
    | "Electrical"
    | "Plumbing"
    | "HVAC"
    | "Safety"
    | "Maintenance"
    | "Cleanliness"
    | "Network"
    | "Furniture"
    | "Other";
  severity: number; // 1-10 scale (auto-calculated by AI)
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical"; // Auto-calculated
  location: firestore.GeoPoint;

  // Multi-modal submission
  submissionType: "text" | "voice" | "image" | "mixed";
  voiceTranscript?: string; // If submitted via voice
  voiceAudioUrl?: string; // Storage URL for voice recording
  images?: string[]; // Storage URLs
  aiImageAnalysis?: string; // Gemini Vision analysis of images

  reportedBy: string; // User ID
  reportedByRole:
    | "student"
    | "faculty"
    | "staff"
    | "facility_manager"
    | "admin";
  assignedTo?: string;
  estimatedCost?: number;
  actualCost?: number;
  estimatedDuration?: number; // in days
  actualDuration?: number;

  // Priority Engine inputs (optional context)
  occupancy?: number; // Number of people affected
  affectedArea?: number; // Square meters
  blocksAccess?: boolean;
  safetyRisk?: boolean;
  criticalInfrastructure?: boolean;
  affectsAcademics?: boolean;
  examPeriod?: boolean;
  currentSemester?: boolean;
  isRecurring?: boolean;
  previousOccurrences?: number;

  // Voting system
  voteCount: number; // Total number of upvotes
  votedBy: string[]; // Array of user IDs who voted

  // AI predictions & insights
  aiRiskScore?: number; // 0-100 (from priority engine)
  aiPredictedRecurrence?: boolean;
  aiRecommendations?: string[];
  aiSummary?: string;

  createdAt: firestore.Timestamp;
  updatedAt: firestore.Timestamp;
  resolvedAt?: firestore.Timestamp;
}

/**
 * Issue History Document
 */
export interface IssueHistory {
  id: string;
  issueId: string;
  fieldName: string;
  oldValue?: any;
  newValue?: any;
  changedBy: string;
  changeType:
    | "status_change"
    | "assignment"
    | "update"
    | "comment"
    | "resolution";
  comment?: string;
  changedAt: firestore.Timestamp;
}

/**
 * Zone Document (for campus zones)
 */
export interface Zone {
  id: string;
  organizationId: string;
  name: string;
  boundary: firestore.GeoPoint[]; // Array of GeoPoints for polygon
  zoneType:
    | "academic"
    | "residential"
    | "administrative"
    | "recreational"
    | "other";
  buildingIds?: string[];
  createdAt: firestore.Timestamp;
  updatedAt: firestore.Timestamp;
}

/**
 * Risk Score Document
 */
export interface RiskScore {
  id: string;
  organizationId: string;
  buildingId?: string;
  zoneId?: string;
  category: string;
  score: number; // 0-100
  riskLevel: "low" | "medium" | "high" | "critical";
  calculatedAt: firestore.Timestamp;
  metadata?: {
    issueCount?: number;
    avgSeverity?: number;
    recentTrend?: string;
    aiReasoning?: string;
  };
}

/**
 * User entity
 */
export interface User {
  id: string; // Firebase Auth UID
  organizationId: string;
  email: string;
  name: string;
  role: "admin" | "facility_manager" | "staff" | "faculty" | "student";
  departmentId?: string;
  phone?: string;
  isActive: boolean;
  permissions: {
    canCreateIssues: boolean;
    canResolveIssues: boolean;
    canAssignIssues: boolean;
    canViewAllIssues: boolean;
    canManageUsers: boolean;
  };
  // Rewards system
  rewardPoints: number; // Total reward points earned
  level: number; // User level based on points (e.g., 1-10)
  badges: string[]; // Array of badge IDs earned
  statistics: {
    issuesReported: number;
    issuesResolved: number; // For facility managers
    votesReceived: number; // Votes on their reported issues
    votesCast: number; // Number of times they voted
    helpfulReports: number; // Issues marked as helpful/resolved quickly
  };
  createdAt: firestore.Timestamp;
  updatedAt: firestore.Timestamp;
  lastLogin?: firestore.Timestamp;
  preferences?: {
    notifications?: boolean;
    emailAlerts?: boolean;
  };
}

/**
 * Issue Prediction entity
 */
export interface IssuePrediction {
  id: string;
  organizationId: string;
  buildingId: string;
  departmentId?: string;
  roomId?: string;
  predictedCategory: string;
  predictedSeverity: number;
  probability: number; // 0-1
  reasoning: string;
  suggestedPreventiveMeasures: string[];
  estimatedTimeframe: string; // e.g., "within 30 days"
  basedOnHistoricalIssues: string[]; // Issue IDs
  createdAt: firestore.Timestamp;
  isActualized: boolean; // Did this prediction come true?
  actualizedIssueId?: string;
  actualizedAt?: firestore.Timestamp;
}

/**
 * Analytics Event Document
 */
export interface AnalyticsEvent {
  id: string;
  organizationId: string;
  eventType:
    | "issue_created"
    | "issue_resolved"
    | "user_login"
    | "report_generated"
    | "prediction_made"
    | "other";
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: firestore.Timestamp;
}

/**
 * Vote Document - tracks individual votes on issues
 */
export interface Vote {
  id: string;
  issueId: string;
  userId: string;
  organizationId: string;
  createdAt: firestore.Timestamp;
}

/**
 * Badge Definition - achievements users can earn
 */
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or icon identifier
  category: "reporter" | "voter" | "resolver" | "community" | "special";
  criteria: {
    type:
      | "issues_reported"
      | "votes_received"
      | "votes_cast"
      | "issues_resolved"
      | "helpful_reports"
      | "streak_days"
      | "points_earned"
      | "custom";
    threshold: number; // e.g., 10 issues, 50 votes, etc.
    description: string;
  };
  pointsAwarded: number; // Points given when badge is earned
  rarity: "common" | "rare" | "epic" | "legendary";
  isActive: boolean;
  createdAt: firestore.Timestamp;
}

/**
 * User Badge - junction table for user-earned badges
 */
export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  organizationId: string;
  earnedAt: firestore.Timestamp;
  progress?: number; // For tracking progress towards next level of same badge
}

/**
 * Reward Transaction - tracks point awards and deductions
 */
export interface RewardTransaction {
  id: string;
  userId: string;
  organizationId: string;
  type:
    | "issue_created"
    | "issue_resolved"
    | "vote_received"
    | "vote_cast"
    | "badge_earned"
    | "helpful_report"
    | "admin_bonus"
    | "penalty";
  points: number; // positive for awards, negative for penalties
  relatedEntityId?: string; // Issue ID, Badge ID, etc.
  relatedEntityType?: "issue" | "badge" | "vote" | "other";
  description: string;
  createdAt: firestore.Timestamp;
}

/**
 * Leaderboard Entry - cached leaderboard data
 */
export interface LeaderboardEntry {
  id: string;
  userId: string;
  organizationId: string;
  userName: string;
  userRole: string;
  rewardPoints: number;
  level: number;
  rank: number;
  issuesReported: number;
  votesReceived: number;
  badges: string[];
  period: "all_time" | "monthly" | "weekly";
  updatedAt: firestore.Timestamp;
}

/**
 * Enums for type safety
 */
export enum IssueCategory {
  STRUCTURAL = "Structural",
  ELECTRICAL = "Electrical",
  PLUMBING = "Plumbing",
  HVAC = "HVAC",
  SAFETY = "Safety",
  MAINTENANCE = "Maintenance",
  CLEANLINESS = "Cleanliness",
  NETWORK = "Network",
  FURNITURE = "Furniture",
  OTHER = "Other",
}

export enum IssueStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  CLOSED = "closed",
}

export enum IssuePriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum UserRole {
  ADMIN = "admin",
  FACILITY_MANAGER = "facility_manager",
  STAFF = "staff",
  FACULTY = "faculty",
  STUDENT = "student",
}
