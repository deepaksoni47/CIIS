"""
Model Utilities and Helper Functions
"""

import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PredictionFormatter:
    """Format model predictions for API/frontend consumption"""
    
    @staticmethod
    def format_predictions(predictions: List[Dict]) -> List[Dict]:
        """
        Format predictions for API response
        
        Args:
            predictions: List of prediction dictionaries
            
        Returns:
            Formatted predictions
        """
        formatted = []
        
        for pred in predictions:
            formatted.append({
                'buildingId': pred['building_id'],
                'buildingName': pred['building_name'],
                'failureProbability': round(float(pred['failure_probability']), 4),
                'riskLevel': pred['failure_risk_level'],
                'estimatedDaysToFailure': int(pred['estimated_days_to_failure']),
                'estimatedFailureDate': (
                    datetime.now() + timedelta(days=pred['estimated_days_to_failure'])
                ).isoformat(),
                'confidence': round(float(pred['confidence']), 4),
                'primaryConcern': pred['primary_concern'],
                'timestamp': datetime.now().isoformat(),
                'actionRequired': pred['failure_risk_level'] in ['CRITICAL', 'HIGH']
            })
        
        return formatted
    
    @staticmethod
    def group_by_risk_level(predictions: List[Dict]) -> Dict[str, List[Dict]]:
        """Group predictions by risk level"""
        grouped = {
            'CRITICAL': [],
            'HIGH': [],
            'MEDIUM': [],
            'LOW': []
        }
        
        for pred in predictions:
            risk_level = pred['failure_risk_level']
            if risk_level in grouped:
                grouped[risk_level].append(pred)
        
        return grouped
    
    @staticmethod
    def get_summary_stats(predictions: List[Dict]) -> Dict[str, Any]:
        """Get summary statistics from predictions"""
        
        if not predictions:
            return {}
        
        df = pd.DataFrame(predictions)
        
        return {
            'totalBuildings': len(df),
            'criticalCount': len(df[df['failure_risk_level'] == 'CRITICAL']),
            'highRiskCount': len(df[df['failure_risk_level'] == 'HIGH']),
            'mediumRiskCount': len(df[df['failure_risk_level'] == 'MEDIUM']),
            'lowRiskCount': len(df[df['failure_risk_level'] == 'LOW']),
            'averageFailureProbability': float(df['failure_probability'].mean()),
            'averageEstimatedDays': int(df['estimated_days_to_failure'].mean()),
            'topConcerns': df['primary_concern'].value_counts().to_dict(),
            'actionRequired': len(df[df['failure_risk_level'].isin(['CRITICAL', 'HIGH'])])
        }


class AlertSystem:
    """Generate alerts based on predictions"""
    
    ALERT_TEMPLATES = {
        'CRITICAL': {
            'title': 'URGENT: Critical Failure Risk Detected',
            'priority': 1,
            'action': 'IMMEDIATE MAINTENANCE REQUIRED'
        },
        'HIGH': {
            'title': 'HIGH: Significant Failure Risk',
            'priority': 2,
            'action': 'SCHEDULE MAINTENANCE SOON'
        },
        'MEDIUM': {
            'title': 'MEDIUM: Moderate Failure Risk',
            'priority': 3,
            'action': 'PLAN MAINTENANCE'
        },
        'LOW': {
            'title': 'LOW: Minor Failure Risk',
            'priority': 4,
            'action': 'ROUTINE MONITORING'
        }
    }
    
    @staticmethod
    def generate_alert(prediction: Dict) -> Dict[str, Any]:
        """Generate alert for a prediction"""
        
        risk_level = prediction['failure_risk_level']
        template = AlertSystem.ALERT_TEMPLATES.get(risk_level, {})
        
        alert = {
            'id': f"alert_{prediction['building_id']}_{datetime.now().timestamp()}",
            'buildingId': prediction['building_id'],
            'buildingName': prediction['building_name'],
            'timestamp': datetime.now().isoformat(),
            'title': template.get('title', 'Failure Risk Alert'),
            'priority': template.get('priority', 4),
            'riskLevel': risk_level,
            'probability': prediction['failure_probability'],
            'estimatedDaysToFailure': prediction['estimated_days_to_failure'],
            'primaryConcern': prediction['primary_concern'],
            'actionRequired': template.get('action', 'REVIEW'),
            'message': f"{template.get('title')} for {prediction['building_name']}. "
                      f"Risk: {prediction['failure_probability']:.0%}. "
                      f"Days to failure: ~{prediction['estimated_days_to_failure']} days. "
                      f"Primary concern: {prediction['primary_concern']}"
        }
        
        return alert
    
    @staticmethod
    def generate_alerts(predictions: List[Dict]) -> List[Dict[str, Any]]:
        """Generate alerts for multiple predictions"""
        alerts = []
        
        for pred in predictions:
            if pred['failure_risk_level'] in ['CRITICAL', 'HIGH']:
                alerts.append(AlertSystem.generate_alert(pred))
        
        return sorted(alerts, key=lambda x: x['priority'])


class DataExporter:
    """Export predictions and results"""
    
    @staticmethod
    def to_csv(predictions: List[Dict], filepath: str) -> None:
        """Export predictions to CSV"""
        df = pd.DataFrame(predictions)
        df.to_csv(filepath, index=False)
        logger.info(f"✓ Exported {len(df)} predictions to {filepath}")
    
    @staticmethod
    def to_json(predictions: List[Dict], filepath: str) -> None:
        """Export predictions to JSON"""
        with open(filepath, 'w') as f:
            json.dump(predictions, f, indent=2, default=str)
        logger.info(f"✓ Exported {len(predictions)} predictions to {filepath}")
    
    @staticmethod
    def to_geojson(predictions: List[Dict], buildings_with_location: pd.DataFrame) -> Dict:
        """Export predictions as GeoJSON for mapping"""
        
        features = []
        
        for pred in predictions:
            building_id = pred['building_id']
            building_location = buildings_with_location[
                buildings_with_location['id'] == building_id
            ]
            
            if len(building_location) == 0:
                continue
            
            # Extract coordinates (assuming GIS location data)
            # This would need actual coordinate data from database
            
            feature = {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [0, 0]  # Placeholder
                },
                'properties': {
                    'buildingId': pred['building_id'],
                    'buildingName': pred['building_name'],
                    'failureProbability': pred['failure_probability'],
                    'riskLevel': pred['failure_risk_level'],
                    'estimatedDaysToFailure': pred['estimated_days_to_failure']
                }
            }
            
            features.append(feature)
        
        return {
            'type': 'FeatureCollection',
            'features': features
        }


class MetricsCalculator:
    """Calculate performance metrics for model evaluation"""
    
    @staticmethod
    def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray, 
                         y_pred_proba: np.ndarray = None) -> Dict[str, float]:
        """
        Calculate comprehensive metrics
        
        Args:
            y_true: True labels
            y_pred: Predicted labels
            y_pred_proba: Predicted probabilities (optional)
            
        Returns:
            Dictionary of metrics
        """
        from sklearn.metrics import (
            accuracy_score, precision_score, recall_score, 
            f1_score, roc_auc_score, confusion_matrix
        )
        
        metrics = {
            'accuracy': accuracy_score(y_true, y_pred),
            'precision': precision_score(y_true, y_pred),
            'recall': recall_score(y_true, y_pred),
            'f1': f1_score(y_true, y_pred),
        }
        
        if y_pred_proba is not None:
            metrics['auc_roc'] = roc_auc_score(y_true, y_pred_proba)
        
        # Confusion matrix
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
        metrics['true_positives'] = int(tp)
        metrics['false_positives'] = int(fp)
        metrics['true_negatives'] = int(tn)
        metrics['false_negatives'] = int(fn)
        metrics['specificity'] = tn / (tn + fp) if (tn + fp) > 0 else 0
        
        return metrics


class PerformanceMonitor:
    """Monitor model performance over time"""
    
    def __init__(self, baseline_metrics: Dict[str, float] = None):
        """Initialize monitor with optional baseline metrics"""
        self.baseline = baseline_metrics or {}
        self.history = []
    
    def log_metrics(self, metrics: Dict[str, float], timestamp: datetime = None) -> None:
        """Log metrics at a point in time"""
        if timestamp is None:
            timestamp = datetime.now()
        
        entry = {
            'timestamp': timestamp,
            'metrics': metrics
        }
        
        # Calculate drift if baseline exists
        if self.baseline:
            entry['drift'] = self._calculate_drift(metrics, self.baseline)
        
        self.history.append(entry)
        logger.info(f"✓ Logged metrics at {timestamp}")
    
    @staticmethod
    def _calculate_drift(current: Dict[str, float], baseline: Dict[str, float]) -> Dict[str, float]:
        """Calculate drift from baseline"""
        drift = {}
        
        for key in current:
            if key in baseline and isinstance(current[key], (int, float)):
                change = current[key] - baseline[key]
                pct_change = (change / baseline[key]) * 100 if baseline[key] != 0 else 0
                drift[key] = {
                    'absolute_change': change,
                    'percent_change': pct_change
                }
        
        return drift
    
    def get_performance_summary(self) -> Dict:
        """Get summary of performance over time"""
        if not self.history:
            return {}
        
        latest = self.history[-1]
        
        summary = {
            'last_update': latest['timestamp'].isoformat(),
            'metrics': latest['metrics'],
            'drift_detected': any(
                abs(v.get('percent_change', 0)) > 5 
                for v in latest.get('drift', {}).values()
            ) if 'drift' in latest else False
        }
        
        return summary
