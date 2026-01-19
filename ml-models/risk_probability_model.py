"""
Risk Probability Model (Phase 3)
Calculates comprehensive risk scores combining failure prediction and anomaly detection
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Any
from datetime import datetime
import joblib
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RiskProbabilityModel:
    """Calculate comprehensive risk probability scores for buildings"""
    
    def __init__(self, 
                 failure_weight: float = 0.4,
                 anomaly_weight: float = 0.3,
                 recency_weight: float = 0.3):
        """
        Initialize risk probability model
        
        Args:
            failure_weight: Weight for failure prediction risk (0.0-1.0)
            anomaly_weight: Weight for anomaly detection (0.0-1.0)
            recency_weight: Weight for issue recency/frequency (0.0-1.0)
        """
        # Normalize weights
        total = failure_weight + anomaly_weight + recency_weight
        self.failure_weight = failure_weight / total
        self.anomaly_weight = anomaly_weight / total
        self.recency_weight = recency_weight / total
        
        self.risk_threshold_critical = 0.80
        self.risk_threshold_high = 0.60
        self.risk_threshold_medium = 0.40
        
        logger.info(f"✓ Initialized Risk Probability Model")
        logger.info(f"  Weights: Failure={self.failure_weight:.2%}, Anomaly={self.anomaly_weight:.2%}, Recency={self.recency_weight:.2%}")
    
    def calculate_building_risk(self,
                               building_id: str,
                               failure_probability: float = 0.0,
                               anomaly_probability: float = 0.0,
                               issue_frequency_score: float = 0.0,
                               recent_high_severity_issues: int = 0) -> Dict[str, Any]:
        """
        Calculate comprehensive risk probability for a building
        
        Args:
            building_id: Building identifier
            failure_probability: Failure prediction probability (0.0-1.0)
            anomaly_probability: Anomaly detection probability (0.0-1.0)
            issue_frequency_score: Normalized issue frequency (0.0-1.0)
            recent_high_severity_issues: Number of recent critical issues
            
        Returns:
            Dictionary with risk scores and details
        """
        
        # Normalize inputs
        failure_prob = max(0.0, min(1.0, failure_probability))
        anomaly_prob = max(0.0, min(1.0, anomaly_probability))
        freq_score = max(0.0, min(1.0, issue_frequency_score))
        
            # Note: Severity boost is now handled in the API layer where issue data is available
            # No additional boost applied here to avoid double-counting
        
        # Calculate weighted composite risk
        composite_risk = (
            self.failure_weight * failure_prob +
            self.anomaly_weight * anomaly_prob +
            self.recency_weight * freq_score
        )
        
        # Apply non-linear scaling (emphasize high-risk buildings)
        # Using sigmoid-like transformation
        risk_probability = 1.0 / (1.0 + np.exp(-5 * (composite_risk - 0.5)))
        
        # Determine risk level
        if risk_probability >= self.risk_threshold_critical:
            risk_level = 'CRITICAL'
            action = 'IMMEDIATE INTERVENTION REQUIRED'
        elif risk_probability >= self.risk_threshold_high:
            risk_level = 'HIGH'
            action = 'URGENT MAINTENANCE REQUIRED'
        elif risk_probability >= self.risk_threshold_medium:
            risk_level = 'MEDIUM'
            action = 'SCHEDULE MAINTENANCE'
        else:
            risk_level = 'LOW'
            action = 'ROUTINE MAINTENANCE'
        
        return {
            'building_id': building_id,
            'risk_probability': float(risk_probability),
            'risk_level': risk_level,
            'action': action,
            'failure_component': float(failure_prob),
            'anomaly_component': float(anomaly_prob),
            'recency_component': float(freq_score),
            'composite_score': float(composite_risk),
            'recent_critical_issues': recent_high_severity_issues,
            'calculated_at': datetime.now().isoformat()
        }
    
    def calculate_category_risk(self,
                               issues_df: pd.DataFrame,
                               buildings_df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate category-specific risk scores
        
        Args:
            issues_df: DataFrame with issues including category
            buildings_df: DataFrame with buildings
            
        Returns:
            DataFrame with category-specific risk scores
        """
        
        try:
            category_risks = []
            
            for category in ['WATER', 'ELECTRICITY', 'WIFI', 'SANITATION', 'TEMPERATURE']:
                category_issues = issues_df[issues_df['category'] == category]
                
                if len(category_issues) == 0:
                    category_risks.append({
                        'category': category,
                        'total_issues': 0,
                        'critical_issues': 0,
                        'avg_resolution_days': 0,
                        'recent_issue_count': 0,
                        'category_risk_score': 0.0
                    })
                    continue
                
                # Count critical issues
                critical_count = len(category_issues[category_issues['severity'] >= 4])
                
                # Calculate average resolution time
                resolved_issues = category_issues[category_issues['status'] == 'RESOLVED']
                if len(resolved_issues) > 0 and 'resolution_days' in resolved_issues.columns:
                    avg_resolution = resolved_issues['resolution_days'].mean()
                else:
                    avg_resolution = 0
                
                # Count recent issues (last 30 days)
                cutoff_date = datetime.now() - pd.Timedelta(days=30)
                recent_count = len(category_issues[
                    pd.to_datetime(category_issues['created_at']) >= cutoff_date
                ])
                
                # Calculate risk score
                # Higher severity ratio, more unresolved issues, more recent = higher risk
                total_issues = len(category_issues)
                severity_ratio = critical_count / total_issues if total_issues > 0 else 0
                
                # Normalize components (0-1)
                severity_component = severity_ratio
                frequency_component = min(1.0, recent_count / 10)  # Normalize: 10+ recent = 1.0
                resolution_component = min(1.0, avg_resolution / 30)  # Normalize: 30+ days = 1.0
                
                # Composite category risk
                category_risk = (severity_component * 0.4 + 
                                frequency_component * 0.35 + 
                                resolution_component * 0.25)
                
                category_risks.append({
                    'category': category,
                    'total_issues': total_issues,
                    'critical_issues': critical_count,
                    'avg_resolution_days': float(avg_resolution),
                    'recent_issue_count': recent_count,
                    'category_risk_score': float(category_risk)
                })
            
            df = pd.DataFrame(category_risks)
            logger.info(f"✓ Calculated category risk scores for {len(df)} categories")
            return df
            
        except Exception as e:
            logger.error(f"✗ Error calculating category risks: {e}")
            raise
    
    def calculate_zone_risk(self,
                           buildings_df: pd.DataFrame,
                           building_risks: List[Dict]) -> pd.DataFrame:
        """
        Aggregate risk at zone level
        
        Args:
            buildings_df: DataFrame with building info including zone
            building_risks: List of building risk dictionaries
            
        Returns:
            DataFrame with zone-level risk aggregation
        """
        
        try:
            # Create mapping of building to risk
            building_risk_map = {risk['building_id']: risk for risk in building_risks}
            
            # Add zone info if available
            zones = set()
            if 'zone' in buildings_df.columns:
                zones = buildings_df['zone'].unique()
            elif 'building_type' in buildings_df.columns:
                zones = buildings_df['building_type'].unique()
            else:
                zones = {'Unknown'}
            
            zone_risks = []
            
            for zone in zones:
                if 'zone' in buildings_df.columns:
                    zone_buildings = buildings_df[buildings_df['zone'] == zone]
                elif 'building_type' in buildings_df.columns:
                    zone_buildings = buildings_df[buildings_df['building_type'] == zone]
                else:
                    zone_buildings = buildings_df
                
                zone_building_ids = zone_buildings['id'].tolist()
                zone_risks_list = [
                    building_risk_map[bid]['risk_probability'] 
                    for bid in zone_building_ids 
                    if bid in building_risk_map
                ]
                
                if not zone_risks_list:
                    continue
                
                # Calculate aggregated metrics
                avg_risk = np.mean(zone_risks_list)
                max_risk = np.max(zone_risks_list)
                critical_count = sum(1 for r in zone_risks_list if r >= self.risk_threshold_critical)
                
                # Zone risk level
                if avg_risk >= self.risk_threshold_critical:
                    zone_risk_level = 'CRITICAL'
                elif avg_risk >= self.risk_threshold_high:
                    zone_risk_level = 'HIGH'
                elif avg_risk >= self.risk_threshold_medium:
                    zone_risk_level = 'MEDIUM'
                else:
                    zone_risk_level = 'LOW'
                
                zone_risks.append({
                    'zone': str(zone),
                    'building_count': len(zone_building_ids),
                    'avg_risk_probability': float(avg_risk),
                    'max_risk_probability': float(max_risk),
                    'critical_buildings': critical_count,
                    'zone_risk_level': zone_risk_level
                })
            
            df = pd.DataFrame(zone_risks)
            logger.info(f"✓ Calculated zone risk scores for {len(df)} zones")
            return df
            
        except Exception as e:
            logger.error(f"✗ Error calculating zone risks: {e}")
            raise
    
    def calculate_risk_confidence(self,
                                 failure_confidence: float = 0.85,
                                 anomaly_confidence: float = 0.80) -> float:
        """
        Calculate overall confidence in risk assessment
        
        Args:
            failure_confidence: Confidence in failure prediction model
            anomaly_confidence: Confidence in anomaly detection model
            
        Returns:
            Combined confidence score (0.0-1.0)
        """
        # Confidence is product of component confidences
        # (both models must be confident for high overall confidence)
        return failure_confidence * anomaly_confidence
    
    def prioritize_buildings(self,
                            building_risks: List[Dict],
                            top_n: int = 10) -> List[Dict]:
        """
        Prioritize buildings for maintenance
        
        Args:
            building_risks: List of building risk dictionaries
            top_n: Number of top-priority buildings to return
            
        Returns:
            Sorted list of top priority buildings
        """
        
        try:
            # Sort by risk probability and recent critical issues
            prioritized = sorted(
                building_risks,
                key=lambda x: (x['risk_probability'], x['recent_critical_issues']),
                reverse=True
            )
            
            return prioritized[:top_n]
            
        except Exception as e:
            logger.error(f"✗ Error prioritizing buildings: {e}")
            raise
    
    def generate_risk_report(self,
                            building_risks: List[Dict],
                            category_risks: pd.DataFrame,
                            zone_risks: pd.DataFrame) -> Dict[str, Any]:
        """
        Generate comprehensive risk report
        
        Args:
            building_risks: List of building risk dictionaries
            category_risks: DataFrame with category risks
            zone_risks: DataFrame with zone risks
            
        Returns:
            Comprehensive risk report dictionary
        """
        
        try:
            # Building-level statistics
            risk_probs = [r['risk_probability'] for r in building_risks]
            critical_buildings = [r for r in building_risks if r['risk_level'] == 'CRITICAL']
            high_buildings = [r for r in building_risks if r['risk_level'] == 'HIGH']
            
            # Category statistics
            high_risk_categories = category_risks[
                category_risks['category_risk_score'] >= 0.6
            ]['category'].tolist() if len(category_risks) > 0 else []
            
            report = {
                'generated_at': datetime.now().isoformat(),
                'summary': {
                    'total_buildings': len(building_risks),
                    'avg_risk_probability': float(np.mean(risk_probs)) if risk_probs else 0.0,
                    'critical_buildings': len(critical_buildings),
                    'high_risk_buildings': len(high_buildings),
                    'critical_percentage': 100 * len(critical_buildings) / len(building_risks) if building_risks else 0
                },
                'risk_distribution': {
                    'CRITICAL': len([r for r in building_risks if r['risk_level'] == 'CRITICAL']),
                    'HIGH': len([r for r in building_risks if r['risk_level'] == 'HIGH']),
                    'MEDIUM': len([r for r in building_risks if r['risk_level'] == 'MEDIUM']),
                    'LOW': len([r for r in building_risks if r['risk_level'] == 'LOW'])
                },
                'top_priority_buildings': self.prioritize_buildings(building_risks, top_n=5),
                'high_risk_categories': high_risk_categories,
                'zone_summary': zone_risks.to_dict('records') if len(zone_risks) > 0 else [],
                'recommendations': self._generate_recommendations(building_risks, category_risks)
            }
            
            logger.info(f"✓ Risk report generated")
            return report
            
        except Exception as e:
            logger.error(f"✗ Error generating risk report: {e}")
            raise
    
    @staticmethod
    def _generate_recommendations(building_risks: List[Dict], 
                                  category_risks: pd.DataFrame) -> List[str]:
        """Generate maintenance recommendations based on risks"""
        
        recommendations = []
        
        # Building-level recommendations
        critical_buildings = [r for r in building_risks if r['risk_level'] == 'CRITICAL']
        if critical_buildings:
            building_names = ', '.join([r['building_id'] for r in critical_buildings[:3]])
            recommendations.append(
                f"URGENT: Schedule immediate inspection for {building_names} "
                f"({len(critical_buildings)} critical buildings)"
            )
        
        high_buildings = [r for r in building_risks if r['risk_level'] == 'HIGH']
        if high_buildings:
            recommendations.append(
                f"Schedule maintenance for {len(high_buildings)} high-risk buildings within 7 days"
            )
        
        # Category-level recommendations
        if len(category_risks) > 0:
            high_risk_cats = category_risks[category_risks['category_risk_score'] >= 0.6]
            if len(high_risk_cats) > 0:
                categories = ', '.join(high_risk_cats['category'].tolist())
                recommendations.append(
                    f"Focus maintenance on {categories} systems - elevated category risk detected"
                )
        
        # Data-driven recommendation
        avg_failure_component = np.mean([r['failure_component'] for r in building_risks])
        avg_anomaly_component = np.mean([r['anomaly_component'] for r in building_risks])
        
        if avg_failure_component > avg_anomaly_component:
            recommendations.append(
                "Failure prediction indicates imminent failures - prioritize preventive maintenance"
            )
        elif avg_anomaly_component > avg_failure_component:
            recommendations.append(
                "Anomalous patterns detected - investigate unusual behavior before failures occur"
            )
        
        return recommendations[:5]  # Return top 5 recommendations
    
    def save_model(self, path: str = 'models/risk_probability_model.pkl') -> None:
        """Save model configuration"""
        try:
            joblib.dump(self, path)
            logger.info(f"✓ Model saved to {path}")
        except Exception as e:
            logger.error(f"✗ Error saving model: {e}")
            raise
    
    @staticmethod
    def load_model(path: str = 'models/risk_probability_model.pkl') -> 'RiskProbabilityModel':
        """Load model configuration"""
        try:
            model = joblib.load(path)
            logger.info(f"✓ Model loaded from {path}")
            return model
        except Exception as e:
            logger.error(f"✗ Error loading model: {e}")
            raise
