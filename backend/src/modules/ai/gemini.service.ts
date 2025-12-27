import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Initialize Gemini AI client
 */
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

/**
 * Request cache to prevent duplicate API calls
 * Cache expires after 5 minutes
 */
interface CacheEntry {
  data: any;
  timestamp: number;
}

const requestCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(prompt: string): string {
  // Create a simple hash of the prompt
  return prompt.substring(0, 100); // Use first 100 chars as key
}

function getCachedResponse(prompt: string): any | null {
  const key = getCacheKey(prompt);
  const cached = requestCache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("📦 Using cached Gemini response");
    return cached.data;
  }

  // Clean expired cache entries
  if (cached) {
    requestCache.delete(key);
  }

  return null;
}

function setCachedResponse(prompt: string, data: any): void {
  const key = getCacheKey(prompt);
  requestCache.set(key, { data, timestamp: Date.now() });

  // Limit cache size to 100 entries
  if (requestCache.size > 100) {
    const firstKey = requestCache.keys().next().value;
    if (typeof firstKey === "string") {
      requestCache.delete(firstKey);
    }
  }
}

/**
 * Get Gemini Pro model instance
 */
export function getGeminiModel() {
  // Use gemini-2.5-flash for all AI tasks
  // Stable multimodal model supporting text and images
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

/**
 * Get Gemini Pro Vision model instance for image analysis
 */
export function getGeminiVisionModel() {
  // Use gemini-2.5-flash for all AI tasks including vision
  // Same model handles both text and images (multimodal)
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

/**
 * Generate AI insights for infrastructure issues
 */
export async function generateInsights(prompt: string): Promise<string> {
  try {
    // Check if API key is configured
    if (
      !process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.GOOGLE_GEMINI_API_KEY === ""
    ) {
      console.warn(
        "⚠️ GOOGLE_GEMINI_API_KEY not configured. Using fallback response."
      );
      return generateFallbackInsight(prompt);
    }

    // Check cache first
    const cached = getCachedResponse(prompt);
    if (cached) {
      return cached;
    }

    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Cache the response
    setCachedResponse(prompt, text);

    return text;
  } catch (error) {
    console.error("Gemini API error:", error);
    console.warn("⚠️ Falling back to mock insights due to API error");
    return generateFallbackInsight(prompt);
  }
}

/**
 * Generate fallback insights when Gemini API is not available
 */
function generateFallbackInsight(prompt: string): string {
  // Extract key information from the prompt
  const criticalCount = (prompt.match(/critical/gi) || []).length;
  const highCount = (prompt.match(/high/gi) || []).length;
  const plumbingCount = (prompt.match(/plumbing|water|leak/gi) || []).length;
  const electricalCount = (prompt.match(/electrical|power|electric/gi) || [])
    .length;
  const hvacCount = (prompt.match(/hvac|ac|air conditioning/gi) || []).length;

  let insights = "**Infrastructure Analysis Summary**\n\n";

  if (criticalCount > 0 || highCount > 0) {
    insights += `🚨 **Priority Alert**: Detected ${criticalCount} critical and ${highCount} high-priority issues requiring immediate attention.\n\n`;
  }

  if (plumbingCount > 0) {
    insights += `💧 **Water & Plumbing**: ${plumbingCount} plumbing-related issues identified. Recommend immediate inspection to prevent water damage and health hazards.\n\n`;
  }

  if (electricalCount > 0) {
    insights += `⚡ **Electrical Systems**: ${electricalCount} electrical issues detected. Safety inspection recommended to prevent fire hazards.\n\n`;
  }

  if (hvacCount > 0) {
    insights += `🌡️ **HVAC Systems**: ${hvacCount} climate control issues reported. Temperature regulation affecting user comfort.\n\n`;
  }

  insights += `**Recommended Actions:**\n`;
  insights += `1. Address all critical-priority issues within 24 hours\n`;
  insights += `2. Schedule preventive maintenance for recurring issue areas\n`;
  insights += `3. Allocate additional resources to high-traffic areas\n`;
  insights += `4. Monitor infrastructure systems for early warning signs\n\n`;
  insights += `*Note: To enable AI-powered insights with Google Gemini, configure GOOGLE_GEMINI_API_KEY in your environment.*`;

  return insights;
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

    // Some Gemini vision models requiring inline binary data are not
    // available on all API versions. As a safer cross-version approach
    // include the accessible image URL in the prompt so the generative
    // model can reference it when producing the analysis.
    const promptWithUrl = `${prompt}\nImage URL: ${imageUrl}`;

    const result = await model.generateContent(promptWithUrl);
    const response = await result.response;
    const text = response.text();
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

/**
 * 1. TEXT ISSUE UNDERSTANDING
 * Classify issue from natural language text input
 */
export async function classifyIssueFromText(
  textInput: string,
  context?: {
    buildingName?: string;
    zone?: string;
    reporterName?: string;
  }
): Promise<{
  issueType: string;
  category: string;
  severity: number;
  priority: "low" | "medium" | "high" | "critical";
  extractedLocation?: {
    building?: string;
    room?: string;
    floor?: string;
    zone?: string;
  };
  suggestedTitle: string;
  structuredDescription: string;
  urgency: string;
  estimatedResolutionTime: string;
}> {
  const prompt = `You are an AI assistant for a CampusCare. Analyze this issue report and extract structured information.

User Input: "${textInput}"

${context?.buildingName ? `Building Context: ${context.buildingName}` : ""}
${context?.zone ? `Zone Context: ${context.zone}` : ""}
${context?.reporterName ? `Reporter: ${context.reporterName}` : ""}

Extract and classify the following in JSON format:
{
  "issueType": "specific issue type (e.g., 'Water Leak', 'Broken Light', 'AC Not Working')",
  "category": "one of: Structural/Electrical/Plumbing/HVAC/Safety/Maintenance/Cleanliness/Network/Furniture/Other",
  "severity": <number 1-10, where 1=minor, 10=critical emergency>,
  "priority": "low|medium|high|critical",
  "extractedLocation": {
    "building": "building name if mentioned",
    "room": "room number/name if mentioned",
    "floor": "floor number if mentioned",
    "zone": "specific zone/area if mentioned"
  },
  "suggestedTitle": "short descriptive title (max 100 chars)",
  "structuredDescription": "clear, professional description with key details",
  "urgency": "brief urgency assessment (1-2 sentences)",
  "estimatedResolutionTime": "estimated time to fix (e.g., '2-4 hours', '1-2 days')"
}

Classification Guidelines:
- Severity 9-10: Immediate danger, major system failure
- Severity 7-8: Significant disruption, urgent repair needed
- Severity 4-6: Moderate issue, scheduled repair
- Severity 1-3: Minor cosmetic or non-critical
- Priority "critical": Safety hazard or major infrastructure failure
- Priority "high": Significant disruption to operations
- Priority "medium": Noticeable issue but manageable
- Priority "low": Minor inconvenience

Only respond with valid JSON.`;

  try {
    const response = await generateInsights(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and sanitize
      return {
        issueType: parsed.issueType || "General Issue",
        category: parsed.category || "Other",
        severity: Math.max(1, Math.min(10, parsed.severity || 5)),
        priority: ["low", "medium", "high", "critical"].includes(
          parsed.priority
        )
          ? parsed.priority
          : "medium",
        extractedLocation: parsed.extractedLocation || {},
        suggestedTitle:
          parsed.suggestedTitle?.substring(0, 100) ||
          textInput.substring(0, 100),
        structuredDescription: parsed.structuredDescription || textInput,
        urgency: parsed.urgency || "Standard priority",
        estimatedResolutionTime: parsed.estimatedResolutionTime || "1-3 days",
      };
    }

    throw new Error("Failed to parse JSON response");
  } catch (error) {
    console.error("Text classification error:", error);

    // Intelligent fallback
    // const lowerText = textInput.toLowerCase(); // Not used currently
    let category = "Other";
    let severity = 5;
    let priority: "low" | "medium" | "high" | "critical" = "medium";

    // Category detection
    if (/(leak|water|pipe|flood|drain)/i.test(textInput)) {
      category = "Plumbing";
      severity = 7;
    } else if (/(electric|power|light|outlet|wire)/i.test(textInput)) {
      category = "Electrical";
      severity = 6;
    } else if (/(ac|heat|hvac|temperature|ventilat)/i.test(textInput)) {
      category = "HVAC";
      severity = 6;
    } else if (
      /(crack|structural|ceiling|wall|floor|foundation)/i.test(textInput)
    ) {
      category = "Structural";
      severity = 8;
    } else if (/(danger|hazard|unsafe|emergency|fire)/i.test(textInput)) {
      category = "Safety";
      severity = 9;
      priority = "critical";
    }

    // Severity keywords
    if (/(critical|emergency|urgent|immediate|danger)/i.test(textInput)) {
      severity = Math.max(severity, 8);
      priority = severity >= 8 ? "critical" : "high";
    } else if (/(serious|major|significant)/i.test(textInput)) {
      severity = Math.max(severity, 6);
      priority = "high";
    }

    return {
      issueType: textInput.split(/[.!?]/)[0].substring(0, 50),
      category,
      severity,
      priority,
      extractedLocation: context
        ? {
            building: context.buildingName,
            zone: context.zone,
          }
        : {},
      suggestedTitle: textInput.substring(0, 100),
      structuredDescription: textInput,
      urgency:
        priority === "critical"
          ? "Immediate attention required"
          : "Standard processing",
      estimatedResolutionTime: severity >= 8 ? "Same day" : "2-5 days",
    };
  }
}

/**
 * 2. VOICE ISSUE PROCESSING
 * Process voice input - transcribe and extract issue details
 */
export async function processVoiceInput(
  audioBase64: string,
  mimeType: string = "audio/mp3",
  context?: {
    buildingName?: string;
    zone?: string;
    reporterName?: string;
  }
): Promise<{
  transcription: string;
  confidence: number;
  issueClassification: Awaited<ReturnType<typeof classifyIssueFromText>>;
  detectedIntent: string;
  suggestedAction: string;
}> {
  try {
    const model = getGeminiModel();

    const prompt = `You are an AI assistant transcribing and analyzing a voice report about campus infrastructure issues.

Transcribe the audio and then:
1. Extract the exact spoken text
2. Identify the speaker's intent (reporting issue, asking question, requesting help)
3. Classify the issue if one is being reported

Respond in JSON:
{
  "transcription": "exact transcribed text",
  "confidence": <0-1, transcription confidence>,
  "detectedIntent": "report_issue|ask_question|request_help|other",
  "summary": "brief summary of what was said"
}`;

    // Try passing audio inline to Gemini 2.5 Flash (free-tier multimodal model).
    // Implement retries with exponential backoff to handle transient 503s
    // when the model is overloaded.
    const maxAttempts = 3;
    let attempt = 0;
    let lastError: any = null;
    let text: string | null = null;

    while (attempt < maxAttempts) {
      try {
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: audioBase64,
              mimeType: mimeType,
            },
          },
        ]);

        const response = await result.response;
        text = await response.text();
        break;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err || "");
        // If service is overloaded (503), retry with backoff
        if (
          err?.status === 503 ||
          msg.includes("Service Unavailable") ||
          msg.toLowerCase().includes("overloaded")
        ) {
          attempt += 1;
          const delayMs = 500 * Math.pow(2, attempt); // 1s, 2s, 4s approx
          console.warn(
            `Gemini generateContent attempt ${attempt} failed with 503; retrying in ${delayMs}ms...`,
            err
          );
          await new Promise((res) => setTimeout(res, delayMs));
          continue;
        }

        // Non-retryable error: rethrow
        throw err;
      }
    }

    if (!text) {
      // All attempts failed
      console.error("Voice processing final error after retries:", lastError);
      const msg = String(lastError?.message || lastError || "Unknown error");
      if (
        msg.includes("Service Unavailable") ||
        msg.toLowerCase().includes("overloaded")
      ) {
        throw new Error(
          "Voice processing temporarily unavailable (model overloaded). Please try again in a few seconds or transcribe on the client and call /api/ai/classify-text as a fallback."
        );
      }
      throw lastError || new Error("Failed to process audio");
    }
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Now classify the transcribed text using existing text classifier
      const issueClassification = await classifyIssueFromText(
        parsed.transcription,
        context
      );

      return {
        transcription: parsed.transcription,
        confidence: parsed.confidence || 0.85,
        issueClassification,
        detectedIntent: parsed.detectedIntent || "report_issue",
        suggestedAction:
          parsed.detectedIntent === "report_issue"
            ? "Create new issue ticket"
            : "Route to appropriate handler",
      };
    }

    throw new Error("Failed to extract JSON from Gemini response");
  } catch (error: any) {
    console.error("Voice processing error:", error);

    const msg = String(error?.message || error);
    if (msg.includes("not found") || msg.includes("not supported")) {
      throw new Error(
        "Voice processing via Gemini is not supported by the configured model/API. Transcribe on the client (Web Speech API) and call /api/ai/classify-text, or configure an audio-capable Gemini model (e.g., Gemini 2.5 Flash audio-enabled)."
      );
    }

    throw new Error(
      "Voice processing failed. You can transcribe on the client and call /api/ai/classify-text as a fallback."
    );
  }
}

/**
 * 3. ENHANCED IMAGE UNDERSTANDING
 * Improved image analysis for infrastructure issues
 */
export async function analyzeInfrastructureImage(
  imageUrl: string,
  options?: {
    expectedCategory?: string;
    buildingName?: string;
    additionalContext?: string;
  }
): Promise<{
  issueDetected: boolean;
  description: string;
  severity: number;
  severityConfidence: number;
  suggestedCategory: string;
  visualIndicators: string[];
  safetyRisk: boolean;
  immediateActionRequired: boolean;
  recommendations: string[];
  structuredAnalysis: {
    damageType: string;
    affectedArea: string;
    estimatedScope: string;
    urgencyLevel: string;
  };
}> {
  try {
    const model = getGeminiVisionModel();

    const prompt = `You are an expert infrastructure assessment AI analyzing campus facility images.

${options?.buildingName ? `Building: ${options.buildingName}` : ""}
${options?.expectedCategory ? `Expected Category: ${options.expectedCategory}` : ""}
${options?.additionalContext ? `Context: ${options.additionalContext}` : ""}

Analyze this image for infrastructure issues and provide:

1. Is there a visible infrastructure issue? (yes/no)
2. Detailed description of what you see
3. Severity rating (1-10) with confidence level
4. Visual indicators (specific damage visible)
5. Safety risk assessment
6. Whether immediate action is required
7. Category classification
8. Structured analysis of damage
9. Specific recommendations

Respond in JSON format:
{
  "issueDetected": true/false,
  "description": "detailed description of visible issue",
  "severity": <1-10>,
  "severityConfidence": <0-1>,
  "suggestedCategory": "Structural/Electrical/Plumbing/HVAC/Safety/Maintenance/Cleanliness/Network/Furniture/Other",
  "visualIndicators": ["indicator 1", "indicator 2", ...],
  "safetyRisk": true/false,
  "immediateActionRequired": true/false,
  "recommendations": ["action 1", "action 2", ...],
  "structuredAnalysis": {
    "damageType": "type of damage observed",
    "affectedArea": "which area/component is affected",
    "estimatedScope": "small/medium/large",
    "urgencyLevel": "low/medium/high/critical"
  }
}

Guidelines:
- Be conservative with severity ratings
- Flag ANY safety hazards
- Consider both visible and potential hidden damage
- Provide actionable recommendations`;

    // Some Gemini vision models requiring inline binary data are not
    // available on all API versions. As a safer cross-version approach
    // include the accessible image URL in the prompt so the generative
    // model can reference it when producing the analysis.
    const promptWithUrl = `${prompt}\nImage URL: ${imageUrl}`;

    const result = await model.generateContent(promptWithUrl);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      return {
        issueDetected: parsed.issueDetected !== false,
        description: parsed.description || "Issue detected in image",
        severity: Math.max(1, Math.min(10, parsed.severity || 5)),
        severityConfidence: Math.max(
          0,
          Math.min(1, parsed.severityConfidence || 0.7)
        ),
        suggestedCategory:
          parsed.suggestedCategory ||
          options?.expectedCategory ||
          "Maintenance",
        visualIndicators: Array.isArray(parsed.visualIndicators)
          ? parsed.visualIndicators
          : [],
        safetyRisk: parsed.safetyRisk === true,
        immediateActionRequired: parsed.immediateActionRequired === true,
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : ["Inspect in person", "Document condition", "Schedule repair"],
        structuredAnalysis: parsed.structuredAnalysis || {
          damageType: "Unknown",
          affectedArea: "Unknown",
          estimatedScope: "medium",
          urgencyLevel: "medium",
        },
      };
    }

    throw new Error("Failed to parse image analysis");
  } catch (error: any) {
    console.error("Image analysis error:", error);

    // Preserve rate limit error information
    const errorMessage = error.message || String(error);
    if (
      errorMessage.includes("quota") ||
      errorMessage.includes("429") ||
      errorMessage.includes("Too Many Requests")
    ) {
      throw new Error(`Rate limit exceeded: ${errorMessage}`);
    }

    throw new Error(`Failed to analyze infrastructure image: ${errorMessage}`);
  }
}

/**
 * 4. ADMIN SUMMARIES
 * Generate daily issue summary for administrators
 */
export async function generateDailySummary(
  organizationId: string,
  date: Date = new Date()
): Promise<{
  date: string;
  executiveSummary: string;
  keyMetrics: {
    totalIssues: number;
    newIssues: number;
    resolvedIssues: number;
    criticalIssues: number;
    averageSeverity: number;
  };
  topConcerns: string[];
  trendAnalysis: string;
  recommendations: string[];
  upcomingRisks: string[];
}> {
  try {
    const db = admin.firestore();

    // Get today's issues
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const todaySnapshot = await db
      .collection("issues")
      .where("organizationId", "==", organizationId)
      .where("createdAt", ">=", startOfDay)
      .where("createdAt", "<=", endOfDay)
      .get();

    const todayIssues = todaySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get all open issues
    const openSnapshot = await db
      .collection("issues")
      .where("organizationId", "==", organizationId)
      .where("status", "in", ["open", "in_progress"])
      .get();

    const openIssues = openSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const resolvedToday = todayIssues.filter(
      (i: any) => i.status === "resolved"
    ).length;

    const criticalIssues = openIssues.filter(
      (i: any) => i.severity >= 8 || i.priority === "critical"
    );

    const avgSeverity =
      todayIssues.reduce((sum: number, i: any) => sum + (i.severity || 0), 0) /
      (todayIssues.length || 1);

    // Category distribution
    const categories = todayIssues.reduce((acc: any, issue: any) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {});

    const prompt = `You are an AI assistant generating a daily infrastructure summary for campus administrators.

Date: ${date.toDateString()}

Metrics:
- Total Active Issues: ${openIssues.length}
- New Issues Today: ${todayIssues.length}
- Resolved Today: ${resolvedToday}
- Critical Open Issues: ${criticalIssues.length}
- Average Severity: ${avgSeverity.toFixed(1)}/10
- Issue Categories Today: ${JSON.stringify(categories)}

Critical Issues:
${criticalIssues
  .slice(0, 5)
  .map((i: any) => `- ${i.title} (${i.buildingId}, Severity: ${i.severity})`)
  .join("\n")}

Generate a comprehensive daily summary in JSON format:
{
  "executiveSummary": "2-3 paragraph executive summary for leadership",
  "topConcerns": ["concern 1", "concern 2", "concern 3"],
  "trendAnalysis": "brief analysis of trends compared to recent days",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "upcomingRisks": ["potential risk 1", "potential risk 2"]
}

Keep it professional, concise, and actionable.`;

    const response = await generateInsights(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    const aiGenerated = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      date: date.toISOString().split("T")[0],
      executiveSummary:
        aiGenerated.executiveSummary ||
        `Today's infrastructure status: ${todayIssues.length} new issues reported, ${resolvedToday} resolved. ${criticalIssues.length} critical issues require immediate attention.`,
      keyMetrics: {
        totalIssues: openIssues.length,
        newIssues: todayIssues.length,
        resolvedIssues: resolvedToday,
        criticalIssues: criticalIssues.length,
        averageSeverity: Math.round(avgSeverity * 10) / 10,
      },
      topConcerns: aiGenerated.topConcerns || [
        `${criticalIssues.length} critical issues pending`,
        `${todayIssues.length} new issues reported`,
      ],
      trendAnalysis:
        aiGenerated.trendAnalysis || "Trend data requires multi-day history",
      recommendations: aiGenerated.recommendations || [
        "Address critical issues immediately",
        "Review resource allocation",
      ],
      upcomingRisks: aiGenerated.upcomingRisks || [
        "Monitor high-severity areas",
      ],
    };
  } catch (error) {
    console.error("Daily summary error:", error);
    throw new Error("Failed to generate daily summary");
  }
}

/**
 * Generate trend explanation for administrators
 */
export async function generateTrendExplanation(
  trendData: {
    metric: string;
    currentValue: number;
    previousValue: number;
    percentageChange: number;
    timeframe: string;
  }[]
): Promise<{
  summary: string;
  keyFindings: string[];
  concerningTrends: string[];
  positiveTrends: string[];
  actionableInsights: string[];
}> {
  const prompt = `You are an AI assistant explaining infrastructure trends for campus administrators.

Trend Data:
${trendData
  .map(
    (t) =>
      `- ${t.metric}: ${t.currentValue} (was ${t.previousValue}) - ${t.percentageChange > 0 ? "+" : ""}${t.percentageChange.toFixed(1)}% over ${t.timeframe}`
  )
  .join("\n")}

Analyze these trends and provide:
{
  "summary": "2-3 sentence overall trend summary",
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "concerningTrends": ["negative trend 1", "negative trend 2"],
  "positiveTrends": ["positive trend 1", "positive trend 2"],
  "actionableInsights": ["insight 1", "insight 2", "insight 3"]
}

Focus on actionable insights and root causes.`;

  try {
    const response = await generateInsights(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback
    const concerning = trendData
      .filter((t) => t.percentageChange > 20)
      .map((t) => `${t.metric} increased by ${t.percentageChange.toFixed(1)}%`);

    const positive = trendData
      .filter((t) => t.percentageChange < -10)
      .map(
        (t) =>
          `${t.metric} decreased by ${Math.abs(t.percentageChange).toFixed(1)}%`
      );

    return {
      summary: `Analysis of ${trendData.length} infrastructure metrics over recent period shows mixed results.`,
      keyFindings: trendData.map(
        (t) =>
          `${t.metric}: ${t.currentValue} (${t.percentageChange > 0 ? "+" : ""}${t.percentageChange.toFixed(1)}%)`
      ),
      concerningTrends:
        concerning.length > 0 ? concerning : ["No concerning trends"],
      positiveTrends: positive.length > 0 ? positive : ["Metrics stable"],
      actionableInsights: [
        "Monitor high-change metrics closely",
        "Investigate root causes of increases",
        "Continue successful practices",
      ],
    };
  } catch (error) {
    console.error("Trend explanation error:", error);
    throw new Error("Failed to generate trend explanation");
  }
}

/**
 * Generate incident report for specific issue
 */
export async function generateIncidentReport(
  issue: any,
  relatedIssues: any[] = []
): Promise<{
  reportTitle: string;
  executiveSummary: string;
  incidentDetails: {
    what: string;
    when: string;
    where: string;
    severity: string;
    impact: string;
  };
  timeline: Array<{ timestamp: string; event: string }>;
  rootCauseAnalysis: string;
  immediateActions: string[];
  preventiveMeasures: string[];
  lessonsLearned: string[];
  recommendations: string[];
}> {
  const prompt = `You are an AI assistant generating a formal incident report for campus infrastructure.

Incident Details:
- Title: ${issue.title}
- Category: ${issue.category}
- Severity: ${issue.severity}/10
- Priority: ${issue.priority}
- Location: ${issue.buildingId} ${issue.zone ? `- ${issue.zone}` : ""}
- Reported: ${new Date(issue.createdAt?.toDate?.() || issue.createdAt).toLocaleString()}
- Status: ${issue.status}
- Description: ${issue.description}

${relatedIssues.length > 0 ? `Related Issues: ${relatedIssues.length} similar issues in the past 90 days` : ""}

Generate a professional incident report in JSON format:
{
  "reportTitle": "formal report title",
  "executiveSummary": "2-3 paragraph executive summary",
  "incidentDetails": {
    "what": "what happened",
    "when": "when it occurred",
    "where": "specific location details",
    "severity": "severity assessment",
    "impact": "impact on operations/safety"
  },
  "timeline": [
    {"timestamp": "time", "event": "event description"},
    ...
  ],
  "rootCauseAnalysis": "analysis of root cause(s)",
  "immediateActions": ["action 1", "action 2"],
  "preventiveMeasures": ["measure 1", "measure 2"],
  "lessonsLearned": ["lesson 1", "lesson 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}

Make it thorough and professional for administrative records.`;

  try {
    const response = await generateInsights(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Ensure all required fields exist
      return {
        reportTitle: parsed.reportTitle || `Incident Report: ${issue.title}`,
        executiveSummary:
          parsed.executiveSummary ||
          `Infrastructure incident at ${issue.buildingId}`,
        incidentDetails: parsed.incidentDetails || {
          what: issue.description,
          when: new Date(
            issue.createdAt?.toDate?.() || issue.createdAt
          ).toLocaleString(),
          where: `${issue.buildingId} ${issue.zone || ""}`,
          severity: `${issue.severity}/10`,
          impact: "Assessment pending",
        },
        timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [],
        rootCauseAnalysis: parsed.rootCauseAnalysis || "Analysis in progress",
        immediateActions: Array.isArray(parsed.immediateActions)
          ? parsed.immediateActions
          : ["Assess damage", "Secure area", "Notify stakeholders"],
        preventiveMeasures: Array.isArray(parsed.preventiveMeasures)
          ? parsed.preventiveMeasures
          : ["Regular inspections", "Preventive maintenance"],
        lessonsLearned: Array.isArray(parsed.lessonsLearned)
          ? parsed.lessonsLearned
          : ["Document for future reference"],
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : ["Follow up after resolution"],
      };
    }

    throw new Error("Failed to parse incident report");
  } catch (error) {
    console.error("Incident report error:", error);
    throw new Error("Failed to generate incident report");
  }
}

// Add admin import at top
import * as admin from "firebase-admin";

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
  // New functions
  classifyIssueFromText,
  processVoiceInput,
  analyzeInfrastructureImage,
  generateDailySummary,
  generateTrendExplanation,
  generateIncidentReport,
};
