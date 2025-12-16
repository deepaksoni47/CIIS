-- BigQuery SQL: Zone Risk Scoring
-- This query calculates risk scores for different zones/buildings

-- Risk Score Calculation
CREATE OR REPLACE TABLE `ciis_analytics.zone_risk_scores` AS
WITH issue_stats AS (
  SELECT
    building_id,
    category,
    COUNT(*) as issue_count,
    AVG(severity) as avg_severity,
    COUNTIF(DATE(created_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)) as recent_issues,
    COUNTIF(DATE(created_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)) as issues_90_days,
    MAX(created_at) as last_issue_date
  FROM `ciis_analytics.issues`
  WHERE building_id IS NOT NULL
    AND created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 180 DAY)
  GROUP BY building_id, category
),
recurrence_rates AS (
  SELECT
    building_id,
    category,
    COUNT(DISTINCT DATE(created_at)) as unique_issue_days,
    DATE_DIFF(MAX(DATE(created_at)), MIN(DATE(created_at)), DAY) as observation_days
  FROM `ciis_analytics.issues`
  WHERE building_id IS NOT NULL
    AND created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 180 DAY)
  GROUP BY building_id, category
  HAVING COUNT(*) >= 2
)
SELECT
  i.building_id,
  i.category,
  i.issue_count,
  i.avg_severity,
  i.recent_issues,
  -- Risk Score (0-10 scale)
  LEAST(10, ROUND(
    (i.issue_count * 0.3) +                          -- Issue frequency
    (i.avg_severity * 1.5) +                         -- Average severity
    (i.recent_issues * 0.5) +                        -- Recent activity
    (COALESCE(r.unique_issue_days / NULLIF(r.observation_days, 0), 0) * 3)  -- Recurrence rate
  , 2)) as risk_score,
  -- Recurrence Probability (0-1 scale)
  ROUND(
    COALESCE(r.unique_issue_days / NULLIF(r.observation_days, 0), 0),
    4
  ) as recurrence_probability,
  i.last_issue_date,
  CURRENT_TIMESTAMP() as calculated_at
FROM issue_stats i
LEFT JOIN recurrence_rates r
  ON i.building_id = r.building_id
  AND i.category = r.category
WHERE i.issue_count >= 2
ORDER BY risk_score DESC, i.issue_count DESC;

-- Aggregate Risk by Building
CREATE OR REPLACE VIEW `ciis_analytics.building_overall_risk` AS
SELECT
  building_id,
  COUNT(DISTINCT category) as affected_categories,
  SUM(issue_count) as total_issues,
  AVG(risk_score) as avg_risk_score,
  MAX(risk_score) as max_risk_score,
  AVG(recurrence_probability) as avg_recurrence_prob,
  MAX(last_issue_date) as most_recent_issue
FROM `ciis_analytics.zone_risk_scores`
GROUP BY building_id
ORDER BY max_risk_score DESC, total_issues DESC;

-- High Risk Alerts
CREATE OR REPLACE VIEW `ciis_analytics.high_risk_alerts` AS
SELECT
  z.*,
  CASE
    WHEN risk_score >= 8 THEN 'CRITICAL'
    WHEN risk_score >= 6 THEN 'HIGH'
    WHEN risk_score >= 4 THEN 'MEDIUM'
    ELSE 'LOW'
  END as risk_level,
  CASE
    WHEN DATE_DIFF(CURRENT_DATE(), DATE(last_issue_date), DAY) <= 7 THEN 'ACTIVE'
    WHEN DATE_DIFF(CURRENT_DATE(), DATE(last_issue_date), DAY) <= 30 THEN 'RECENT'
    ELSE 'HISTORICAL'
  END as activity_status
FROM `ciis_analytics.zone_risk_scores` z
WHERE risk_score >= 6
ORDER BY risk_score DESC, last_issue_date DESC;
