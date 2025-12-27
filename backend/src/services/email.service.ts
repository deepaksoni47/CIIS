import * as brevo from "@getbrevo/brevo";
import { User, Issue } from "../types";

/**
 * Email Service for sending transactional emails
 * Uses Brevo (formerly Sendinblue) - Free 300 emails/day, no domain verification needed
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Initialize Brevo API client
const apiInstance = new brevo.TransactionalEmailsApi();
if (process.env.BREVO_API_KEY) {
  apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY
  );
}

/**
 * Send a generic email using Brevo
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    // Check if Brevo is configured
    if (!process.env.BREVO_API_KEY) {
      console.warn("⚠️ BREVO_API_KEY not set - email skipped");
      console.log(`📧 Would send to: ${options.to}`);
      console.log(`   Subject: ${options.subject}`);
      return;
    }

    console.log(`📧 Sending email via Brevo to: ${options.to}`);
    console.log(`   Subject: ${options.subject}`);

    const fromEmail = process.env.BREVO_FROM_EMAIL || "ciis.innovex@gmail.com";
    const fromName =
      process.env.BREVO_FROM_NAME || "Campus Infrastructure System";

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { name: fromName, email: fromEmail };
    sendSmtpEmail.to = [{ email: options.to }];
    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.htmlContent = options.html;

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log(`✅ Email sent successfully to ${options.to}`);
    console.log(`   Message ID: ${result.body?.messageId || "N/A"}`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);
    }
    // Don't throw error - email failure shouldn't break the main functionality
  }
}

/**
 * Send welcome email to newly registered users
 */
export async function sendWelcomeEmail(user: User): Promise<void> {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .email-wrapper {
      max-width: 600px;
      margin: 40px auto;
      padding: 0 20px;
    }
    .container {
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
      position: relative;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 8px;
      background: linear-gradient(90deg, #ffd700 0%, #ff6b6b 50%, #4ecdc4 100%);
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .logo-icon {
      font-size: 64px;
      margin-bottom: 10px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 24px;
      color: #667eea;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .intro-text {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 25px;
      line-height: 1.7;
    }
    .features {
      background: linear-gradient(135deg, #f8f9ff 0%, #fff5f7 100%);
      border-radius: 12px;
      padding: 25px;
      margin: 30px 0;
      border-left: 5px solid #667eea;
    }
    .features-title {
      font-size: 18px;
      color: #2d3748;
      font-weight: 600;
      margin-bottom: 15px;
    }
    .feature-grid {
      display: grid;
      gap: 12px;
    }
    .feature-item {
      display: flex;
      align-items: flex-start;
      padding: 10px;
      background: rgba(255, 255, 255, 0.7);
      border-radius: 8px;
      transition: transform 0.2s;
    }
    .feature-icon {
      font-size: 24px;
      margin-right: 12px;
      flex-shrink: 0;
    }
    .feature-text {
      font-size: 14px;
      color: #4a5568;
      line-height: 1.5;
    }
    .feature-text strong {
      color: #2d3748;
      display: block;
      margin-bottom: 2px;
    }
    .account-details {
      background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
      border-radius: 12px;
      padding: 20px 25px;
      margin: 25px 0;
    }
    .detail-row {
      display: flex;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(102, 126, 234, 0.1);
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-icon {
      font-size: 20px;
      margin-right: 10px;
      width: 30px;
    }
    .detail-label {
      color: #718096;
      font-size: 14px;
      margin-right: 8px;
    }
    .detail-value {
      color: #667eea;
      font-weight: 600;
      font-size: 14px;
    }
    .cta-container {
      text-align: center;
      margin: 35px 0;
    }
    .cta-button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
    }
    .support-text {
      font-size: 14px;
      color: #718096;
      text-align: center;
      margin: 25px 0;
    }
    .signature {
      font-size: 15px;
      color: #4a5568;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
    }
    .signature strong {
      color: #667eea;
    }
    .footer {
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      padding: 25px 30px;
      text-align: center;
    }
    .footer-text {
      color: #718096;
      font-size: 13px;
      margin: 5px 0;
    }
    .footer-links {
      margin-top: 15px;
    }
    .footer-link {
      color: #667eea;
      text-decoration: none;
      font-size: 12px;
      margin: 0 8px;
    }
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        margin: 20px auto;
      }
      .header h1 {
        font-size: 24px;
      }
      .greeting {
        font-size: 20px;
      }
      .cta-button {
        padding: 14px 30px;
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-icon">🏫</div>
        <h1>Welcome to CIIS!</h1>
      </div>
      
      <div class="content">
        <div class="greeting">Hello ${user.name}! 👋</div>
        
        <p class="intro-text">
          Thank you for joining the <strong>CampusCare</strong>. 
          We're thrilled to have you as part of our community dedicated to making our campus better!
        </p>
        
        <div class="features">
          <div class="features-title">🚀 What you can do with CampusCare:</div>
          <div class="feature-grid">
            <div class="feature-item">
              <div class="feature-icon">🔍</div>
              <div class="feature-text">
                <strong>Report Issues</strong>
                Quickly report infrastructure problems and help improve campus facilities
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">📍</div>
              <div class="feature-text">
                <strong>Interactive Heatmaps</strong>
                Visualize problem areas with real-time heatmap data
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">🗳️</div>
              <div class="feature-text">
                <strong>Vote on Issues</strong>
                Help prioritize what matters most to the community
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">🏆</div>
              <div class="feature-text">
                <strong>Earn Rewards</strong>
                Get points and badges for active participation
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">🤖</div>
              <div class="feature-text">
                <strong>AI-Powered Insights</strong>
                Get intelligent analysis and smart recommendations
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">📊</div>
              <div class="feature-text">
                <strong>Real-time Tracking</strong>
                Monitor issue resolution and progress live
              </div>
            </div>
          </div>
        </div>
        
        <div class="account-details">
          <div class="detail-row">
            <div class="detail-icon">📧</div>
            <div class="detail-label">Email:</div>
            <div class="detail-value">${user.email}</div>
          </div>
          <div class="detail-row">
            <div class="detail-icon">👤</div>
            <div class="detail-label">Role:</div>
            <div class="detail-value">${user.role}</div>
          </div>
          <div class="detail-row">
            <div class="detail-icon">🏢</div>
            <div class="detail-label">Organization:</div>
            <div class="detail-value">${user.organizationId}</div>
          </div>
        </div>
        
        <div class="cta-container">
          <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login" class="cta-button">
            🚀 Get Started Now
          </a>
        </div>
        
        <p class="support-text">
          Need help getting started? Our support team is here to assist you!
        </p>
        
        <div class="signature">
          Best regards,<br>
          <strong>The CIIS Team</strong> 💜
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          This is an automated message from the Campus Infrastructure Intelligence System
        </p>
        <p class="footer-text">
          © ${new Date().getFullYear()} CIIS. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  await sendEmail({
    to: user.email,
    subject: "🎉 Welcome to CampusCare!",
    html,
  });
}

/**
 * Send issue resolution notification to the user who reported it
 */
export async function sendIssueResolvedEmail(
  user: User,
  issue: Issue,
  resolutionComment?: string
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    }
    .email-wrapper {
      max-width: 600px;
      margin: 40px auto;
      padding: 0 20px;
    }
    .container {
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .header {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      padding: 40px 30px;
      text-align: center;
      position: relative;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 8px;
      background: linear-gradient(90deg, #ffd700 0%, #4ecdc4 50%, #95e1d3 100%);
    }
    .checkmark-icon {
      width: 80px;
      height: 80px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 15px;
      font-size: 48px;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .success-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.25);
      color: white;
      padding: 8px 20px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 10px;
      backdrop-filter: blur(10px);
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 24px;
      color: #11998e;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .intro-text {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 25px;
      line-height: 1.7;
    }
    .issue-card {
      background: linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%);
      border-radius: 12px;
      padding: 25px;
      margin: 25px 0;
      border-left: 5px solid #11998e;
    }
    .issue-card-title {
      font-size: 18px;
      color: #2d3748;
      font-weight: 600;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
    }
    .issue-card-title::before {
      content: '📋';
      font-size: 24px;
      margin-right: 10px;
    }
    .issue-detail {
      display: flex;
      align-items: flex-start;
      padding: 10px 0;
      border-bottom: 1px solid rgba(17, 153, 142, 0.1);
    }
    .issue-detail:last-child {
      border-bottom: none;
    }
    .detail-icon {
      font-size: 20px;
      margin-right: 12px;
      min-width: 28px;
    }
    .detail-content {
      flex: 1;
    }
    .detail-label {
      font-size: 13px;
      color: #718096;
      font-weight: 500;
      margin-bottom: 3px;
    }
    .detail-value {
      font-size: 15px;
      color: #2d3748;
      font-weight: 500;
    }
    .severity-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
    }
    .severity-high {
      background: #fee;
      color: #c53030;
    }
    .severity-medium {
      background: #fef3c7;
      color: #d97706;
    }
    .severity-low {
      background: #e0f2fe;
      color: #0369a1;
    }
    .resolution-box {
      background: linear-gradient(135deg, #dffff7 0%, #ccfff3 100%);
      border: 2px solid #11998e;
      border-radius: 12px;
      padding: 20px;
      margin: 25px 0;
    }
    .resolution-title {
      color: #11998e;
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 12px 0;
      display: flex;
      align-items: center;
    }
    .resolution-title::before {
      content: '🔧';
      font-size: 24px;
      margin-right: 10px;
    }
    .resolution-text {
      font-size: 15px;
      color: #2d3748;
      line-height: 1.6;
      margin-bottom: 12px;
    }
    .resolution-meta {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid rgba(17, 153, 142, 0.2);
    }
    .meta-item {
      display: flex;
      align-items: center;
      font-size: 14px;
      color: #4a5568;
    }
    .meta-item strong {
      color: #11998e;
      margin-left: 5px;
    }
    .stats-row {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 12px;
      padding: 20px;
      margin: 25px 0;
      display: flex;
      justify-content: space-around;
      flex-wrap: wrap;
      gap: 15px;
    }
    .stat-item {
      text-align: center;
    }
    .stat-number {
      font-size: 28px;
      font-weight: 700;
      color: #d97706;
      display: block;
    }
    .stat-label {
      font-size: 13px;
      color: #92400e;
      font-weight: 500;
    }
    .reward-banner {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 12px;
      padding: 20px 25px;
      margin: 25px 0;
      text-align: center;
      border: 2px dashed #fbbf24;
    }
    .reward-banner-icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .reward-banner-text {
      font-size: 16px;
      color: #92400e;
      font-weight: 600;
    }
    .cta-container {
      text-align: center;
      margin: 35px 0;
    }
    .cta-button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      color: #ffffff;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 10px 30px rgba(17, 153, 142, 0.4);
      transition: all 0.3s ease;
    }
    .closing-text {
      font-size: 15px;
      color: #4a5568;
      text-align: center;
      margin: 25px 0;
      line-height: 1.6;
    }
    .signature {
      font-size: 15px;
      color: #4a5568;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
    }
    .signature strong {
      color: #11998e;
    }
    .footer {
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      padding: 25px 30px;
      text-align: center;
    }
    .footer-text {
      color: #718096;
      font-size: 13px;
      margin: 5px 0;
    }
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        margin: 20px auto;
      }
      .header h1 {
        font-size: 24px;
      }
      .greeting {
        font-size: 20px;
      }
      .stats-row {
        flex-direction: column;
      }
      .cta-button {
        padding: 14px 30px;
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="checkmark-icon">✅</div>
        <h1>Issue Resolved!</h1>
        <span class="success-badge">COMPLETED</span>
      </div>
      
      <div class="content">
        <div class="greeting">Great News, ${user.name}! 🎉</div>
        
        <p class="intro-text">
          The infrastructure issue you reported has been successfully resolved. Thank you for 
          your contribution in helping us maintain and improve our campus facilities!
        </p>
        
        <div class="issue-card">
          <div class="issue-card-title">Issue Details</div>
          
          <div class="issue-detail">
            <div class="detail-icon">📝</div>
            <div class="detail-content">
              <div class="detail-label">Title</div>
              <div class="detail-value">${issue.title}</div>
            </div>
          </div>
          
          <div class="issue-detail">
            <div class="detail-icon">📄</div>
            <div class="detail-content">
              <div class="detail-label">Description</div>
              <div class="detail-value">${issue.description}</div>
            </div>
          </div>
          
          <div class="issue-detail">
            <div class="detail-icon">🏷️</div>
            <div class="detail-content">
              <div class="detail-label">Category</div>
              <div class="detail-value">${issue.category}</div>
            </div>
          </div>
          
          <div class="issue-detail">
            <div class="detail-icon">⚠️</div>
            <div class="detail-content">
              <div class="detail-label">Severity Level</div>
              <div class="detail-value">
                <span class="severity-badge ${issue.severity >= 7 ? "severity-high" : issue.severity >= 4 ? "severity-medium" : "severity-low"}">
                  ${issue.severity}/10
                </span>
              </div>
            </div>
          </div>
          
          <div class="issue-detail">
            <div class="detail-icon">🆔</div>
            <div class="detail-content">
              <div class="detail-label">Issue ID</div>
              <div class="detail-value">${issue.id}</div>
            </div>
          </div>
        </div>
        
        ${
          resolutionComment
            ? `
        <div class="resolution-box">
          <h3 class="resolution-title">Resolution Details</h3>
          <p class="resolution-text">${resolutionComment}</p>
          ${
            issue.actualCost || issue.actualDuration
              ? `
          <div class="resolution-meta">
            ${issue.actualCost ? `<div class="meta-item">💰 Cost: <strong>₹${issue.actualCost}</strong></div>` : ""}
            ${issue.actualDuration ? `<div class="meta-item">⏱️ Duration: <strong>${issue.actualDuration} days</strong></div>` : ""}
          </div>
          `
              : ""
          }
        </div>
        `
            : ""
        }
        
        ${
          issue.voteCount
            ? `
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-number">${issue.voteCount}</span>
            <span class="stat-label">Community Votes</span>
          </div>
        </div>
        `
            : ""
        }
        
        <div class="reward-banner">
          <div class="reward-banner-icon">🏆</div>
          <div class="reward-banner-text">
            You've earned reward points for this contribution!<br>
            Check your dashboard to see your updated balance.
          </div>
        </div>
        
        <div class="cta-container">
          <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/issues/${issue.id}" class="cta-button">
            📊 View Issue Details
          </a>
        </div>
        
        <p class="closing-text">
          Your active participation makes a real difference in improving our campus. 
          Keep reporting issues and helping the community! 💪
        </p>
        
        <div class="signature">
          Best regards,<br>
          <strong>The CampusCare Team</strong> 💚
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          This is an automated message from the CampusCare
        </p>
        <p class="footer-text">
          © ${new Date().getFullYear()} CampusCare. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  await sendEmail({
    to: user.email,
    subject: `✅ Your Issue "${issue.title}" Has Been Resolved!`,
    html,
  });
}

/**
 * Send issue deletion notification to the user who reported it
 */
export async function sendIssueDeletedEmail(
  user: User,
  issue: Issue
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    .email-wrapper {
      max-width: 600px;
      margin: 40px auto;
      padding: 0 20px;
    }
    .container {
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .header {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      padding: 40px 30px;
      text-align: center;
      position: relative;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 8px;
      background: linear-gradient(90deg, #ffa07a 0%, #fa8072 50%, #ff6347 100%);
    }
    .icon {
      font-size: 64px;
      margin-bottom: 15px;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .status-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.25);
      color: white;
      padding: 8px 20px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 10px;
      backdrop-filter: blur(10px);
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 24px;
      color: #f5576c;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .intro-text {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 25px;
      line-height: 1.7;
    }
    .issue-card {
      background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
      border-radius: 12px;
      padding: 25px;
      margin: 25px 0;
      border-left: 5px solid #f5576c;
    }
    .issue-card-title {
      font-size: 18px;
      color: #2d3748;
      font-weight: 600;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
    }
    .issue-card-title::before {
      content: '🗑️';
      font-size: 24px;
      margin-right: 10px;
    }
    .issue-detail {
      display: flex;
      align-items: flex-start;
      padding: 10px 0;
      border-bottom: 1px solid rgba(245, 87, 108, 0.1);
    }
    .issue-detail:last-child {
      border-bottom: none;
    }
    .detail-icon {
      font-size: 20px;
      margin-right: 12px;
      min-width: 28px;
    }
    .detail-content {
      flex: 1;
    }
    .detail-label {
      font-size: 13px;
      color: #718096;
      font-weight: 500;
      margin-bottom: 3px;
    }
    .detail-value {
      font-size: 15px;
      color: #2d3748;
      font-weight: 500;
    }
    .info-box {
      background: linear-gradient(135deg, #fff9e6 0%, #fff5cc 100%);
      border: 2px solid #fbbf24;
      border-radius: 12px;
      padding: 20px 25px;
      margin: 25px 0;
    }
    .info-box-icon {
      font-size: 32px;
      margin-bottom: 10px;
      text-align: center;
    }
    .info-box-text {
      font-size: 15px;
      color: #92400e;
      text-align: center;
      line-height: 1.6;
    }
    .cta-container {
      text-align: center;
      margin: 35px 0;
    }
    .cta-button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: #ffffff;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 10px 30px rgba(245, 87, 108, 0.4);
      transition: all 0.3s ease;
    }
    .closing-text {
      font-size: 15px;
      color: #4a5568;
      text-align: center;
      margin: 25px 0;
      line-height: 1.6;
    }
    .signature {
      font-size: 15px;
      color: #4a5568;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
    }
    .signature strong {
      color: #f5576c;
    }
    .footer {
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      padding: 25px 30px;
      text-align: center;
    }
    .footer-text {
      color: #718096;
      font-size: 13px;
      margin: 5px 0;
    }
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        margin: 20px auto;
      }
      .header h1 {
        font-size: 24px;
      }
      .greeting {
        font-size: 20px;
      }
      .cta-button {
        padding: 14px 30px;
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="icon">🗑️</div>
        <h1>Issue Deleted</h1>
        <span class="status-badge">REMOVED</span>
      </div>
      
      <div class="content">
        <div class="greeting">Hello ${user.name},</div>
        
        <p class="intro-text">
          We're writing to inform you that your reported issue has been deleted from the system.
        </p>
        
        <div class="issue-card">
          <div class="issue-card-title">Deleted Issue Details</div>
          
          <div class="issue-detail">
            <div class="detail-icon">📝</div>
            <div class="detail-content">
              <div class="detail-label">Title</div>
              <div class="detail-value">${issue.title}</div>
            </div>
          </div>
          
          <div class="issue-detail">
            <div class="detail-icon">📄</div>
            <div class="detail-content">
              <div class="detail-label">Description</div>
              <div class="detail-value">${issue.description}</div>
            </div>
          </div>
          
          <div class="issue-detail">
            <div class="detail-icon">🏷️</div>
            <div class="detail-content">
              <div class="detail-label">Category</div>
              <div class="detail-value">${issue.category}</div>
            </div>
          </div>
          
          <div class="issue-detail">
            <div class="detail-icon">🆔</div>
            <div class="detail-content">
              <div class="detail-label">Issue ID</div>
              <div class="detail-value">${issue.id}</div>
            </div>
          </div>
        </div>
        
        <div class="info-box">
          <div class="info-box-icon">ℹ️</div>
          <div class="info-box-text">
            This issue has been removed from the active issues list. If you believe this was done in error 
            or have any questions, please contact the facility management team.
          </div>
        </div>
        
        <div class="cta-container">
          <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/issues" class="cta-button">
            📋 View All Issues
          </a>
        </div>
        
        <p class="closing-text">
          Thank you for your contribution in helping improve our campus infrastructure.
        </p>
        
        <div class="signature">
          Best regards,<br>
          <strong>The CampusCare Team</strong>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          This is an automated message from the CampusCare
        </p>
        <p class="footer-text">
          © ${new Date().getFullYear()} CampusCare. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  await sendEmail({
    to: user.email,
    subject: `🗑️ Your Issue "${issue.title}" Has Been Deleted`,
    html,
  });
}
