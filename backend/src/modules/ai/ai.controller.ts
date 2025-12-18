import { Request, Response } from "express";
import * as geminiService from "./gemini.service";
import { getFirestore } from "../../config/firebase";

/**
 * Generate AI insights for all issues
 */
export async function generateGeneralInsights(_req: Request, res: Response) {
  try {
    const db = getFirestore();
    const issuesSnapshot = await db
      .collection("issues")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const issues = issuesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (issues.length === 0) {
      return res.status(404).json({
        error: "No issues found",
        message: "Cannot generate insights without issue data",
      });
    }

    const insights = await geminiService.analyzeIssuePatterns(issues);

    res.json({
      success: true,
      data: {
        insights,
        analyzedIssues: issues.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error generating insights:", error);
    res.status(500).json({
      error: "Failed to generate insights",
      message: error.message,
    });
  }
}

/**
 * Generate risk assessment for a specific building
 */
export async function generateBuildingRisk(req: Request, res: Response) {
  try {
    const { buildingId } = req.params;

    if (!buildingId) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "buildingId is required",
      });
    }

    const db = getFirestore();

    // Get building info
    const buildingDoc = await db.collection("buildings").doc(buildingId).get();

    if (!buildingDoc.exists) {
      return res.status(404).json({
        error: "Building not found",
        message: `Building with ID ${buildingId} does not exist`,
      });
    }

    const building = buildingDoc.data();

    // Get recent issues for this building (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const issuesSnapshot = await db
      .collection("issues")
      .where("buildingId", "==", buildingId)
      .where("createdAt", ">=", thirtyDaysAgo)
      .get();

    const recentIssues = issuesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const riskAssessment = await geminiService.generateRiskAssessment(
      building?.name || buildingId,
      recentIssues
    );

    res.json({
      success: true,
      data: {
        buildingId,
        buildingName: building?.name,
        ...riskAssessment,
        recentIssuesCount: recentIssues.length,
        assessmentDate: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error generating building risk:", error);
    res.status(500).json({
      error: "Failed to generate risk assessment",
      message: error.message,
    });
  }
}

/**
 * Generate AI summary for a specific issue
 */
export async function generateIssueSummary(req: Request, res: Response) {
  try {
    const { issueId } = req.params;

    if (!issueId) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "issueId is required",
      });
    }

    const db = getFirestore();
    const issueDoc = await db.collection("issues").doc(issueId).get();

    if (!issueDoc.exists) {
      return res.status(404).json({
        error: "Issue not found",
        message: `Issue with ID ${issueId} does not exist`,
      });
    }

    const issue = { id: issueDoc.id, ...issueDoc.data() };
    const summary = await geminiService.generateIssueSummary(issue);

    res.json({
      success: true,
      data: {
        issueId,
        summary,
        originalIssue: issue,
      },
    });
  } catch (error: any) {
    console.error("Error generating issue summary:", error);
    res.status(500).json({
      error: "Failed to generate summary",
      message: error.message,
    });
  }
}

/**
 * Get maintenance suggestions for an issue
 */
export async function getMaintenanceSuggestions(req: Request, res: Response) {
  try {
    const { category, severity } = req.query;

    if (!category || !severity) {
      return res.status(400).json({
        error: "Missing parameters",
        message: "category and severity are required",
      });
    }

    const severityNum = parseInt(severity as string, 10);

    if (isNaN(severityNum) || severityNum < 1 || severityNum > 10) {
      return res.status(400).json({
        error: "Invalid severity",
        message: "Severity must be a number between 1 and 10",
      });
    }

    const suggestions = await geminiService.suggestMaintenanceActions(
      category as string,
      severityNum
    );

    res.json({
      success: true,
      data: {
        category,
        severity: severityNum,
        suggestions,
      },
    });
  } catch (error: any) {
    console.error("Error generating maintenance suggestions:", error);
    res.status(500).json({
      error: "Failed to generate suggestions",
      message: error.message,
    });
  }
}

/**
 * Chat with AI assistant
 */
export async function chatWithAI(req: Request, res: Response) {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "message is required in request body",
      });
    }

    const systemPrompt = `You are an AI assistant for a Campus Infrastructure Intelligence System. 
Help facility managers and administrators with infrastructure-related questions, issue analysis, 
and maintenance recommendations. Keep responses professional and actionable.

User Question: ${message}`;

    const response = await geminiService.generateInsights(systemPrompt);

    res.json({
      success: true,
      data: {
        userMessage: message,
        aiResponse: response,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error in AI chat:", error);
    res.status(500).json({
      error: "Failed to process chat message",
      message: error.message,
    });
  }
}
