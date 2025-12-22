import { IssueCategory, IssuePriority } from "../../types";

/**
 * Priority Scoring Inputs
 */
export interface PriorityInput {
  // Core issue data
  category: IssueCategory;
  severity?: number; // 1-10 scale
  description?: string;

  // Location factors
  buildingId?: string;
  roomId?: string;
  roomType?: string;
  affectedArea?: number; // square meters
  occupancy?: number; // number of people affected

  // Time factors
  reportedAt: Date;
  isRecurring?: boolean;
  previousOccurrences?: number;

  // Impact factors
  blocksAccess?: boolean; // Does it prevent access to area?
  safetyRisk?: boolean; // Immediate safety concern?
  criticalInfrastructure?: boolean; // Water, power, network, etc.
  affectsAcademics?: boolean; // Disrupts classes/exams?
  weatherSensitive?: boolean; // Gets worse with rain/heat?

  // Context factors
  timeOfDay?: "morning" | "afternoon" | "evening" | "night";
  dayOfWeek?: "weekday" | "weekend";
  currentSemester?: boolean; // Is it during active semester?
  examPeriod?: boolean; // During exams?

  // Historical data
  avgResolutionTime?: number; // hours for this category
  historicalCostAvg?: number;
  escalationRate?: number; // % of similar issues that escalated

  // Voting system (NEW)
  voteCount?: number; // Number of upvotes
}

/**
 * Priority Score Result
 */
export interface PriorityScore {
  score: number; // 0-100
  priority: IssuePriority;
  confidence: number; // 0-1
  breakdown: {
    categoryScore: number;
    severityScore: number;
    impactScore: number;
    urgencyScore: number;
    contextScore: number;
    historicalScore: number;
    voteScore: number; // NEW: Community voting influence
  };
  reasoning: string[];
  recommendedSLA: number; // hours
}

/**
 * Category Weight Configuration
 */
interface CategoryWeights {
  [key: string]: {
    baseScore: number;
    multiplier: number;
    slaHours: number;
  };
}

/**
 * Priority Engine - Deterministic scoring algorithm
 */
export class PriorityEngine {
  private categoryWeights: CategoryWeights = {
    [IssueCategory.SAFETY]: {
      baseScore: 85,
      multiplier: 1.5,
      slaHours: 2,
    },
    [IssueCategory.STRUCTURAL]: {
      baseScore: 80,
      multiplier: 1.4,
      slaHours: 4,
    },
    [IssueCategory.ELECTRICAL]: {
      baseScore: 70,
      multiplier: 1.3,
      slaHours: 8,
    },
    [IssueCategory.PLUMBING]: {
      baseScore: 65,
      multiplier: 1.2,
      slaHours: 12,
    },
    [IssueCategory.HVAC]: {
      baseScore: 50,
      multiplier: 1.1,
      slaHours: 24,
    },
    [IssueCategory.NETWORK]: {
      baseScore: 45,
      multiplier: 1.15,
      slaHours: 16,
    },
    [IssueCategory.MAINTENANCE]: {
      baseScore: 40,
      multiplier: 1.0,
      slaHours: 48,
    },
    [IssueCategory.CLEANLINESS]: {
      baseScore: 30,
      multiplier: 0.9,
      slaHours: 24,
    },
    [IssueCategory.FURNITURE]: {
      baseScore: 25,
      multiplier: 0.8,
      slaHours: 72,
    },
    [IssueCategory.OTHER]: {
      baseScore: 35,
      multiplier: 1.0,
      slaHours: 48,
    },
  };

  /**
   * Calculate priority score
   */
  public calculatePriority(input: PriorityInput): PriorityScore {
    const breakdown = {
      categoryScore: this.calculateCategoryScore(input),
      severityScore: this.calculateSeverityScore(input),
      impactScore: this.calculateImpactScore(input),
      urgencyScore: this.calculateUrgencyScore(input),
      contextScore: this.calculateContextScore(input),
      historicalScore: this.calculateHistoricalScore(input),
      voteScore: this.calculateVoteScore(input), // NEW
    };

    // Weighted combination (adjusted to include votes)
    const score = Math.min(
      100,
      Math.round(
        breakdown.categoryScore * 0.22 +
          breakdown.severityScore * 0.18 +
          breakdown.impactScore * 0.22 +
          breakdown.urgencyScore * 0.13 +
          breakdown.contextScore * 0.1 +
          breakdown.historicalScore * 0.05 +
          breakdown.voteScore * 0.1 // NEW: 10% weight for community votes
      )
    );

    const priority = this.scoreToPriority(score);
    const reasoning = this.generateReasoning(input, breakdown, score);
    const recommendedSLA = this.calculateSLA(input.category, score);
    const confidence = this.calculateConfidence(input);

    return {
      score,
      priority,
      confidence,
      breakdown,
      reasoning,
      recommendedSLA,
    };
  }

  /**
   * Category-based base score
   */
  private calculateCategoryScore(input: PriorityInput): number {
    const weights = this.categoryWeights[input.category];
    if (!weights) {
      return this.categoryWeights[IssueCategory.OTHER].baseScore;
    }

    let score = weights.baseScore;

    // Critical infrastructure boost
    if (input.criticalInfrastructure) {
      score += 15;
    }

    // Safety risk boost
    if (input.safetyRisk) {
      score += 20;
    }

    return Math.min(100, score);
  }

  /**
   * Severity-based score (1-10 scale)
   */
  private calculateSeverityScore(input: PriorityInput): number {
    const severity = input.severity || 5;
    let score = severity * 10; // Convert to 0-100 scale

    // Adjust based on category multiplier
    const weights = this.categoryWeights[input.category];
    if (weights) {
      score *= weights.multiplier;
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Impact score based on affected people and area
   */
  private calculateImpactScore(input: PriorityInput): number {
    let score = 0;

    // Occupancy impact (0-40 points)
    if (input.occupancy) {
      if (input.occupancy > 100) score += 40;
      else if (input.occupancy > 50) score += 30;
      else if (input.occupancy > 20) score += 20;
      else if (input.occupancy > 5) score += 10;
      else score += 5;
    }

    // Area impact (0-20 points)
    if (input.affectedArea) {
      if (input.affectedArea > 500) score += 20;
      else if (input.affectedArea > 200) score += 15;
      else if (input.affectedArea > 50) score += 10;
      else score += 5;
    }

    // Access blockage (0-25 points)
    if (input.blocksAccess) {
      score += 25;
    }

    // Academic disruption (0-15 points)
    if (input.affectsAcademics) {
      score += 15;
    }

    return Math.min(100, score);
  }

  /**
   * Urgency score based on time sensitivity
   */
  private calculateUrgencyScore(input: PriorityInput): number {
    let score = 50; // Base urgency

    // Recurring issue penalty
    if (input.isRecurring) {
      score += 20;
    }
    if (input.previousOccurrences) {
      score += Math.min(15, input.previousOccurrences * 3);
    }

    // Weather sensitivity
    if (input.weatherSensitive) {
      score += 10;
    }

    // Time decay - older issues get slightly lower urgency
    const hoursSinceReport =
      (Date.now() - input.reportedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceReport > 72) {
      score -= 10; // Issue lingering, might be lower priority
    } else if (hoursSinceReport < 1) {
      score += 10; // Very fresh, high urgency
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Context score based on timing
   */
  private calculateContextScore(input: PriorityInput): number {
    let score = 50; // Base context

    // Exam period boost
    if (input.examPeriod) {
      score += 30;
    }

    // Semester activity
    if (input.currentSemester) {
      score += 10;
    }

    // Time of day considerations
    if (input.timeOfDay === "morning" || input.timeOfDay === "afternoon") {
      score += 10; // Peak hours
    } else if (input.timeOfDay === "night") {
      score -= 10; // Can wait until morning for non-critical
    }

    // Weekend consideration
    if (input.dayOfWeek === "weekend") {
      // Lower priority unless it's safety/structural
      if (
        input.category !== IssueCategory.SAFETY &&
        input.category !== IssueCategory.STRUCTURAL &&
        !input.safetyRisk
      ) {
        score -= 15;
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Historical score based on past data
   */
  private calculateHistoricalScore(input: PriorityInput): number {
    let score = 50; // Base historical

    // Escalation rate
    if (input.escalationRate) {
      score += input.escalationRate * 30; // 0-30 points based on escalation %
    }

    // Average resolution time (slow resolution = higher priority)
    if (input.avgResolutionTime) {
      if (input.avgResolutionTime > 72) score += 20;
      else if (input.avgResolutionTime > 48) score += 15;
      else if (input.avgResolutionTime > 24) score += 10;
      else score += 5;
    }

    // Cost factor (expensive fixes get attention)
    if (input.historicalCostAvg) {
      if (input.historicalCostAvg > 50000) score += 15;
      else if (input.historicalCostAvg > 20000) score += 10;
      else if (input.historicalCostAvg > 5000) score += 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * NEW: Vote score based on community voting
   * Reflects the collective urgency perceived by the community
   */
  private calculateVoteScore(input: PriorityInput): number {
    const voteCount = input.voteCount || 0;

    if (voteCount === 0) {
      return 0; // No votes, no boost
    }

    // Logarithmic scale - first votes matter more
    // 1 vote = 10 points
    // 5 votes = 23 points
    // 10 votes = 33 points
    // 20 votes = 43 points
    // 50 votes = 57 points
    // 100+ votes = 67 points
    let score = Math.log10(voteCount + 1) * 33;

    // Cap at 70 points so votes don't override critical infrastructure issues
    score = Math.min(70, score);

    // Bonus for trending issues (high votes in short time)
    // This could be enhanced with vote velocity data in the future

    return Math.round(score);
  }

  /**
   * Convert score to priority enum
   */
  private scoreToPriority(score: number): IssuePriority {
    if (score >= 80) return IssuePriority.CRITICAL;
    if (score >= 60) return IssuePriority.HIGH;
    if (score >= 40) return IssuePriority.MEDIUM;
    return IssuePriority.LOW;
  }

  /**
   * Calculate recommended SLA in hours
   */
  private calculateSLA(category: IssueCategory, score: number): number {
    const baselineSLA = this.categoryWeights[category]?.slaHours || 48;

    // Adjust SLA based on score
    if (score >= 90) return Math.min(baselineSLA, 2); // 2 hours max
    if (score >= 80) return Math.min(baselineSLA, 4);
    if (score >= 70) return Math.min(baselineSLA, 8);
    if (score >= 60) return Math.min(baselineSLA, 12);
    if (score >= 50) return Math.min(baselineSLA, 24);

    return baselineSLA;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(input: PriorityInput): number {
    let confidence = 0.5; // Base confidence

    // More data points = higher confidence
    if (input.severity !== undefined) confidence += 0.1;
    if (input.occupancy !== undefined) confidence += 0.1;
    if (input.affectedArea !== undefined) confidence += 0.05;
    if (input.avgResolutionTime !== undefined) confidence += 0.1;
    if (input.escalationRate !== undefined) confidence += 0.1;
    if (input.previousOccurrences !== undefined) confidence += 0.05;

    return Math.min(1.0, confidence);
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    input: PriorityInput,
    _breakdown: any,
    score: number
  ): string[] {
    const reasons: string[] = [];

    // Category reasoning
    if (
      input.category === IssueCategory.SAFETY ||
      input.category === IssueCategory.STRUCTURAL
    ) {
      reasons.push(
        `${input.category} issues are inherently high-priority due to safety concerns`
      );
    }

    // Safety flag
    if (input.safetyRisk) {
      reasons.push("Immediate safety risk identified (+20 points)");
    }

    // Impact reasoning
    if (input.occupancy && input.occupancy > 50) {
      reasons.push(`High occupancy area (${input.occupancy} people affected)`);
    }

    if (input.blocksAccess) {
      reasons.push("Blocks access to critical area (+25 points)");
    }

    if (input.affectsAcademics) {
      reasons.push("Disrupts academic activities (+15 points)");
    }

    // Urgency reasoning
    if (input.isRecurring) {
      reasons.push(
        `Recurring issue (${input.previousOccurrences || 0} previous occurrences)`
      );
    }

    // Context reasoning
    if (input.examPeriod) {
      reasons.push("Exam period - elevated priority (+30 points)");
    }

    if (input.criticalInfrastructure) {
      reasons.push("Critical infrastructure affected (+15 points)");
    }

    // Historical reasoning
    if (input.escalationRate && input.escalationRate > 0.5) {
      reasons.push(
        `High escalation rate (${(input.escalationRate * 100).toFixed(0)}% of similar issues escalated)`
      );
    }

    // NEW: Vote reasoning
    if (input.voteCount && input.voteCount > 0) {
      if (input.voteCount >= 20) {
        reasons.push(
          `🔥 Strong community support (${input.voteCount} votes) - Widely recognized issue`
        );
      } else if (input.voteCount >= 10) {
        reasons.push(
          `📈 Community voted (${input.voteCount} votes) - Significant concern`
        );
      } else if (input.voteCount >= 5) {
        reasons.push(
          `✋ Community support (${input.voteCount} votes) - Validated concern`
        );
      } else {
        reasons.push(
          `👍 Community support (${input.voteCount} vote${input.voteCount === 1 ? "" : "s"})`
        );
      }
    }

    // Score summary
    if (score >= 80) {
      reasons.push("⚠️ CRITICAL priority - Immediate attention required");
    } else if (score >= 60) {
      reasons.push("🔴 HIGH priority - Address within SLA window");
    } else if (score >= 40) {
      reasons.push("🟡 MEDIUM priority - Schedule for resolution");
    } else {
      reasons.push("🟢 LOW priority - Address when resources available");
    }

    return reasons;
  }

  /**
   * Batch calculate priorities for multiple issues
   */
  public batchCalculate(inputs: PriorityInput[]): PriorityScore[] {
    return inputs.map((input) => this.calculatePriority(input));
  }

  /**
   * Recalculate priority for existing issue with new context
   */
  public recalculate(
    originalInput: PriorityInput,
    contextUpdates: Partial<PriorityInput>
  ): PriorityScore {
    const updatedInput = { ...originalInput, ...contextUpdates };
    return this.calculatePriority(updatedInput);
  }
}

// Singleton instance
export const priorityEngine = new PriorityEngine();
