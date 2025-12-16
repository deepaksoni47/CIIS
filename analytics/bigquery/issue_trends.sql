-- BigQuery SQL: Issue Trends Analysis
-- This query analyzes trends in infrastructure issues over time

-- Daily Issue Trends
CREATE OR REPLACE VIEW `ciis_analytics.daily_issue_trends` AS
SELECT
  DATE(created_at) as date,
  category,
  COUNT(*) as issue_count,
  AVG(severity) as avg_severity,
  COUNTIF(status = 'RESOLVED') as resolved_count,
  COUNTIF(status = 'OPEN') as open_count
FROM `ciis_analytics.issues`
WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
GROUP BY date, category
ORDER BY date DESC, category;

-- Weekly Issue Aggregation
CREATE OR REPLACE VIEW `ciis_analytics.weekly_issue_summary` AS
SELECT
  DATE_TRUNC(created_at, WEEK) as week_start,
  category,
  COUNT(*) as total_issues,
  AVG(severity) as avg_severity,
  COUNT(DISTINCT building_id) as affected_buildings,
  AVG(TIMESTAMP_DIFF(resolved_at, created_at, HOUR)) as avg_resolution_hours
FROM `ciis_analytics.issues`
WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 180 DAY)
GROUP BY week_start, category
ORDER BY week_start DESC, category;

-- Category Comparison
CREATE OR REPLACE VIEW `ciis_analytics.category_comparison` AS
SELECT
  category,
  COUNT(*) as total_issues,
  AVG(severity) as avg_severity,
  COUNTIF(status = 'RESOLVED') / COUNT(*) as resolution_rate,
  COUNTIF(DATE(created_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)) as issues_last_30_days,
  COUNTIF(DATE(created_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)) as issues_last_7_days
FROM `ciis_analytics.issues`
GROUP BY category
ORDER BY total_issues DESC;

-- Top Problem Locations
CREATE OR REPLACE VIEW `ciis_analytics.top_problem_locations` AS
SELECT
  building_id,
  COUNT(*) as issue_count,
  AVG(severity) as avg_severity,
  COUNT(DISTINCT category) as category_diversity,
  STRING_AGG(DISTINCT category ORDER BY category) as categories,
  MAX(created_at) as last_issue_date
FROM `ciis_analytics.issues`
WHERE building_id IS NOT NULL
  AND created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
GROUP BY building_id
HAVING COUNT(*) >= 5
ORDER BY issue_count DESC
LIMIT 20;

-- Time-of-Day Analysis
CREATE OR REPLACE VIEW `ciis_analytics.hourly_patterns` AS
SELECT
  EXTRACT(HOUR FROM created_at) as hour_of_day,
  EXTRACT(DAYOFWEEK FROM created_at) as day_of_week,
  category,
  COUNT(*) as issue_count
FROM `ciis_analytics.issues`
WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
GROUP BY hour_of_day, day_of_week, category
ORDER BY hour_of_day, day_of_week, category;

-- Recurrence Analysis
CREATE OR REPLACE VIEW `ciis_analytics.recurring_issues` AS
WITH issue_locations AS (
  SELECT
    building_id,
    category,
    COUNT(*) as occurrence_count,
    AVG(severity) as avg_severity,
    MIN(created_at) as first_occurrence,
    MAX(created_at) as last_occurrence,
    DATE_DIFF(MAX(DATE(created_at)), MIN(DATE(created_at)), DAY) as time_span_days
  FROM `ciis_analytics.issues`
  WHERE building_id IS NOT NULL
    AND created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 180 DAY)
  GROUP BY building_id, category
  HAVING COUNT(*) >= 3
)
SELECT
  *,
  occurrence_count / GREATEST(time_span_days / 30.0, 1) as monthly_recurrence_rate
FROM issue_locations
ORDER BY occurrence_count DESC, avg_severity DESC;
