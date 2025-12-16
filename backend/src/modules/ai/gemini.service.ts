import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";

/**
 * Initialize Gemini AI client
 */
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

/**
 * Get Gemini Pro model instance
 */
export function getGeminiModel() {
  return genAI.getGenerativeModel({ model: "gemini-pro" });
}

/**
 * Get Gemini Pro Vision model instance for image analysis
 */
export function getGeminiVisionModel() {
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

/**
 * Generate AI insights for infrastructure issues
 */
export async function generateInsights(prompt: string): Promise<string> {
  try {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate AI insights");
  }
}

/**
 * Analyze issue patterns and provide recommendations
 */
export async function analyzeIssuePatterns(issues: any[]): Promise<string> {
  const summary = {
    totalIssues: issues.length,
    categories: issues.reduce((acc: any, issue: any) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {}),
    avgSeverity:
      issues.reduce((sum: number, i: any) => sum + i.severity, 0) /
      issues.length,
  };

  const prompt = `You are an infrastructure management AI assistant analyzing campus facility issues.

Issue Summary:
- Total Issues: ${summary.totalIssues}
- Categories: ${JSON.stringify(summary.categories, null, 2)}
- Average Severity: ${summary.avgSeverity.toFixed(1)}/10

Based on this data, provide:
1. Key patterns and trends
2. Priority areas requiring immediate attention
3. Recommended preventive measures
4. Resource allocation suggestions

Keep the response concise and actionable (3-4 paragraphs).`;

  return await generateInsights(prompt);
}

/**
 * Generate risk assessment for a specific zone/building
 */
export async function generateRiskAssessment(
  location: string,
  recentIssues: any[]
): Promise<{
  riskScore: number;
  riskLevel: string;
  reasoning: string;
}> {
  const issueCount = recentIssues.length;
  const avgSeverity =
    recentIssues.reduce((sum, i) => sum + i.severity, 0) / issueCount || 0;
  const categories = [
    ...new Set(recentIssues.map((i) => i.category)),
  ] as string[];

  const prompt = `Assess infrastructure risk for: ${location}

Recent Activity (Last 30 days):
- Total Issues: ${issueCount}
- Average Severity: ${avgSeverity.toFixed(1)}/10
- Issue Types: ${categories.join(", ")}

Provide a JSON response with:
{
  "riskScore": <number 0-100>,
  "riskLevel": "<LOW|MEDIUM|HIGH|CRITICAL>",
  "reasoning": "<2-3 sentence explanation>"
}`;

  try {
    const response = await generateInsights(prompt);
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback: calculate basic risk score
    const riskScore = Math.min(
      100,
      Math.round((issueCount * 5 + avgSeverity * 8) / 2)
    );
    return {
      riskScore,
      riskLevel:
        riskScore > 75
          ? "CRITICAL"
          : riskScore > 50
            ? "HIGH"
            : riskScore > 25
              ? "MEDIUM"
              : "LOW",
      reasoning: response.substring(0, 200),
    };
  } catch (error) {
    throw new Error("Failed to generate risk assessment");
  }
}

/**
 * Generate natural language summary of issue
 */
export async function generateIssueSummary(issue: any): Promise<string> {
  const prompt = `Summarize this infrastructure issue in a clear, professional manner (2-3 sentences):

Category: ${issue.category}
Severity: ${issue.severity}/10
Location: ${issue.buildingId || "Unknown"}
Description: ${issue.description || "No description provided"}
Status: ${issue.status}

Provide a concise summary suitable for a facility manager.`;

  return await generateInsights(prompt);
}

/**
 * Suggest maintenance actions based on issue type
 */
export async function suggestMaintenanceActions(
  category: string,
  severity: number
): Promise<string[]> {
  const prompt = `Suggest 3-5 specific maintenance actions for:

Issue Type: ${category}
Severity Level: ${severity}/10

Provide actionable steps as a JSON array of strings.
Example: ["Step 1", "Step 2", "Step 3"]`;

  try {
    const response = await generateInsights(prompt);
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback suggestions
    return [
      `Inspect ${category.toLowerCase()} infrastructure`,
      "Assess extent of damage",
      "Prioritize based on severity",
      "Schedule maintenance crew",
      "Document resolution",
    ];
  } catch (error) {
    console.error("Failed to parse maintenance suggestions:", error);
    return ["Contact maintenance team for assessment"];
  }
}

/**
 * Analyze infrastructure issue from image using Gemini Vision
 */
export async function analyzeIssueImage(
  imageUrl: string,
  category?: string
): Promise<{
  description: string;
  severity: number;
  suggestedCategory: string;
  recommendations: string[];
}> {
  try {
    const model = getGeminiVisionModel();

    const prompt = `You are an infrastructure assessment AI analyzing a campus facility issue.

${category ? `Expected Category: ${category}` : ""}

Analyze this image and provide:
1. Detailed description of the issue
2. Severity rating (1-10)
3. Issue category (Structural/Electrical/Plumbing/HVAC/Safety/Maintenance/Cleanliness/Network/Furniture/Other)
4. 3-5 immediate action recommendations

Respond in JSON format:
{
  "description": "detailed description",
  "severity": <number 1-10>,
  "suggestedCategory": "category name",
  "recommendations": ["action 1", "action 2", ...]
}`;

    // Fetch image as base64
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback
    return {
      description: text.substring(0, 300),
      severity: 5,
      suggestedCategory: category || "Maintenance",
      recommendations: [
        "Inspect the issue in person",
        "Document current condition",
        "Schedule repair",
      ],
    };
  } catch (error) {
    console.error("Image analysis error:", error);
    throw new Error("Failed to analyze image");
  }
}

/**
 * Calculate priority based on severity and category
 */
export function calculatePriority(
  severity: number,
  category: string
): "low" | "medium" | "high" | "critical" {
  // Critical categories with high severity
  if (
    ["Structural", "Safety", "Electrical"].includes(category) &&
    severity >= 8
  ) {
    return "critical";
  }

  if (severity >= 8) return "high";
  if (severity >= 6) return "medium";
  if (severity >= 4) return "low";
  return "low";
}

/**
 * Generate failure prediction for a building/room
 */
export async function generateFailurePrediction(
  locationName: string,
  historicalIssues: any[]
): Promise<{
  predictedCategory: string;
  probability: number;
  timeframe: string;
  reasoning: string;
  preventiveMeasures: string[];
}> {
  if (historicalIssues.length === 0) {
    return {
      predictedCategory: "None",
      probability: 0,
      timeframe: "N/A",
      reasoning: "Insufficient historical data for prediction",
      preventiveMeasures: ["Continue regular maintenance inspections"],
    };
  }

  const categoryCount = historicalIssues.reduce((acc: any, issue: any) => {
    acc[issue.category] = (acc[issue.category] || 0) + 1;
    return acc;
  }, {});

  const mostCommon = Object.entries(categoryCount).sort(
    ([, a]: any, [, b]: any) => b - a
  )[0];

  const prompt = `Analyze failure patterns for: ${locationName}

Historical Issues (Last 90 days):
- Total Issues: ${historicalIssues.length}
- Most Common Category: ${mostCommon[0]} (${mostCommon[1]} occurrences)
- Categories: ${JSON.stringify(categoryCount)}

Predict:
1. Most likely next failure category
2. Probability (0-1)
3. Estimated timeframe
4. Reasoning
5. 3-5 preventive measures

Respond in JSON:
{
  "predictedCategory": "category",
  "probability": <0-1>,
  "timeframe": "within X days/weeks",
  "reasoning": "explanation",
  "preventiveMeasures": ["measure 1", ...]
}`;

  try {
    const response = await generateInsights(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback prediction
    return {
      predictedCategory: mostCommon[0] as string,
      probability: Math.min(
        0.8,
        (mostCommon[1] as number) / historicalIssues.length + 0.3
      ),
      timeframe: "within 30 days",
      reasoning: `Based on ${mostCommon[1]} previous ${mostCommon[0]} issues`,
      preventiveMeasures: [
        `Increase ${mostCommon[0]} inspections`,
        "Schedule preventive maintenance",
        "Monitor for early warning signs",
      ],
    };
  } catch (error) {
    console.error("Prediction error:", error);
    throw new Error("Failed to generate prediction");
  }
}

export default {
  getGeminiModel,
  getGeminiVisionModel,
  generateInsights,
  analyzeIssuePatterns,
  generateRiskAssessment,
  generateIssueSummary,
  suggestMaintenanceActions,
  analyzeIssueImage,
  calculatePriority,
  generateFailurePrediction,
};
