"""
API Integration Example
Shows how to integrate the ML model with the backend API
"""

from flask import Flask, jsonify, request
from datetime import datetime
import logging
from typing import Dict, Any
import os
import json
import numpy as np

from data_loader import LocalDataLoader
from feature_engineering import FeatureEngineer
from failure_prediction_model import FailurePredictionModel
from anomaly_detection_model import AnomalyDetectionModel, AnomalyFeatureEngineer
from risk_probability_model import RiskProbabilityModel
from model_utils import PredictionFormatter, AlertSystem, DataExporter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PredictionAPI:
    """API wrapper for failure prediction model"""
    
    def __init__(self):
        """Initialize API with loaded model"""
        self.model = FailurePredictionModel(model_type='xgboost')
        self.formatter = PredictionFormatter()
        self.alerts = AlertSystem()
        
        # Try to load saved model
        if not self.model.load_model():
            logger.warning("⚠ Saved model not found. Train model first.")
        
        self.engineer = FeatureEngineer()
        
        # Initialize anomaly detection models
        self.anomaly_if = None
        self.anomaly_svm = None
        self.anomaly_engineer = AnomalyFeatureEngineer()
        self._load_anomaly_models()
        
        # Initialize risk model
        self.risk_model = None
        self._load_risk_model()
    
    def _load_anomaly_models(self):
        """Load anomaly detection models if available"""
        try:
            if os.path.exists('models/anomaly_isolation_forest.pkl'):
                self.anomaly_if = AnomalyDetectionModel(algorithm='isolation_forest')
                self.anomaly_if.load_model(
                    model_path='models/anomaly_isolation_forest.pkl',
                    scaler_path='models/anomaly_if_scaler.pkl'
                )
                logger.info("✓ Isolation Forest anomaly model loaded")
            
            if os.path.exists('models/anomaly_one_class_svm.pkl'):
                self.anomaly_svm = AnomalyDetectionModel(algorithm='one_class_svm')
                self.anomaly_svm.load_model(
                    model_path='models/anomaly_one_class_svm.pkl',
                    scaler_path='models/anomaly_svm_scaler.pkl'
                )
                logger.info("✓ One-Class SVM anomaly model loaded")
        except Exception as e:
            logger.warning(f"⚠ Could not load anomaly models: {e}")
    
    def _load_risk_model(self):
        """Load risk probability model if available"""
        try:
            if os.path.exists('models/risk_probability_model.pkl'):
                self.risk_model = RiskProbabilityModel.load_model()
                logger.info("✓ Risk probability model loaded")
            else:
                self.risk_model = None
                logger.warning("⚠ Risk model not found at models/risk_probability_model.pkl")
        except Exception as e:
            logger.warning(f"⚠ Could not load risk model: {e}")
            self.risk_model = None
    
    def get_predictions(self) -> Dict[str, Any]:
        """Get failure predictions for all buildings"""
        
        try:
            # Load data
            issues_df, buildings_df, _ = LocalDataLoader.load_sample_data()
            
            # Engineer features
            features_df, _ = self.engineer.create_training_dataset(issues_df, buildings_df)
            X, _ = self.model.prepare_data(features_df)
            
            # Make predictions
            predictions = self.model.predict_time_window(X, issues_df, buildings_df)
            
            # Format for API
            formatted = self.formatter.format_predictions(predictions)
            
            return {
                'status': 'success',
                'timestamp': datetime.now().isoformat(),
                'predictions': formatted,
                'summary': self.formatter.get_summary_stats(predictions)
            }
        
        except Exception as e:
            logger.error(f"Error getting predictions: {e}")
            return {
                'status': 'error',
                'message': str(e)
            }
    
    def get_predictions_by_building(self, building_id: str) -> Dict[str, Any]:
        """Get prediction for specific building"""
        
        try:
            issues_df, buildings_df, _ = LocalDataLoader.load_sample_data()
            features_df, _ = self.engineer.create_training_dataset(issues_df, buildings_df)
            X, _ = self.model.prepare_data(features_df)
            
            # Filter for building
            building_idx = X.index[buildings_df['id'] == building_id]
            
            if len(building_idx) == 0:
                return {
                    'status': 'error',
                    'message': f'Building {building_id} not found'
                }
            
            # Make prediction
            predictions = self.model.predict_time_window(
                X.iloc[building_idx], issues_df, buildings_df.iloc[building_idx]
            )
            
            formatted = self.formatter.format_predictions(predictions)
            
            return {
                'status': 'success',
                'prediction': formatted[0] if formatted else None
            }
        
        except Exception as e:
            logger.error(f"Error getting building prediction: {e}")
            return {
                'status': 'error',
                'message': str(e)
            }
    
    def get_alerts(self) -> Dict[str, Any]:
        """Get all active alerts"""
        
        try:
            # Get predictions
            predictions_response = self.get_predictions()
            
            if predictions_response['status'] != 'success':
                return predictions_response
            
            # Generate alerts
            alerts = self.alerts.generate_alerts(
                [p for p in predictions_response['predictions']]
            )
            
            return {
                'status': 'success',
                'timestamp': datetime.now().isoformat(),
                'alerts': alerts,
                'totalAlerts': len(alerts),
                'criticalAlerts': len([a for a in alerts if a['priority'] == 1])
            }
        
        except Exception as e:
            logger.error(f"Error generating alerts: {e}")
            return {
                'status': 'error',
                'message': str(e)
            }
    
    def get_risk_summary(self) -> Dict[str, Any]:
        """Get risk summary by level"""
        
        try:
            predictions_response = self.get_predictions()
            
            if predictions_response['status'] != 'success':
                return predictions_response
            
            predictions = predictions_response['predictions']
            grouped = self.formatter.group_by_risk_level(predictions)
            
            return {
                'status': 'success',
                'timestamp': datetime.now().isoformat(),
                'riskLevels': {
                    level: len(buildings) 
                    for level, buildings in grouped.items()
                },
                'buildings': grouped
            }
        
        except Exception as e:
            logger.error(f"Error getting risk summary: {e}")
            return {
                'status': 'error',
                'message': str(e)
            }
    
    def get_anomalies(self) -> Dict[str, Any]:
        """Get anomalies detected in building data"""
        
        if not self.anomaly_if:
            return {
                'status': 'error',
                'message': 'Anomaly detection models not trained. Run: python train_anomaly_detection.py'
            }
        
        try:
            # Load data
            issues_df, buildings_df, _ = LocalDataLoader.load_sample_data()
            
            # Engineer features
            features_df = self.anomaly_engineer.engineer_anomaly_features(issues_df, buildings_df)
            
            # Select numeric features
            import numpy as np
            numeric_features = features_df.select_dtypes(include=[np.number]).columns.tolist()
            numeric_features = [f for f in numeric_features if 'id' not in f and 'name' not in f]
            X = features_df[numeric_features].fillna(0).replace([np.inf, -np.inf], 0)
            
            # Detect anomalies
            if_preds, if_scores, if_probs = self.anomaly_if.detect_anomalies(X)
            svm_preds, svm_scores, svm_probs = self.anomaly_svm.detect_anomalies(X)
            
            # Ensemble
            ensemble_probs = (if_probs + svm_probs) / 2
            
            # Create results
            anomalies = []
            for i, building_id in enumerate(features_df['id']):
                anomaly_prob = float(ensemble_probs[i])
                
                if anomaly_prob > 0.4:  # Include medium and above
                    if anomaly_prob >= 0.8:
                        severity = 'CRITICAL'
                    elif anomaly_prob >= 0.6:
                        severity = 'HIGH'
                    else:
                        severity = 'MEDIUM'
                    
                    anomalies.append({
                        'building_id': building_id,
                        'building_name': features_df.iloc[i].get('name', building_id),
                        'anomaly_probability': anomaly_prob,
                        'anomaly_severity': severity,
                        'if_probability': float(if_probs[i]),
                        'svm_probability': float(svm_probs[i]),
                    })
            
            # Sort by probability
            anomalies = sorted(anomalies, key=lambda x: x['anomaly_probability'], reverse=True)
            
            return {
                'status': 'success',
                'timestamp': datetime.now().isoformat(),
                'anomalies': anomalies,
                'total_anomalies': len(anomalies),
                'critical_count': len([a for a in anomalies if a['anomaly_severity'] == 'CRITICAL']),
                'high_count': len([a for a in anomalies if a['anomaly_severity'] == 'HIGH']),
                'medium_count': len([a for a in anomalies if a['anomaly_severity'] == 'MEDIUM'])
            }
        
        except Exception as e:
            logger.error(f"Error detecting anomalies: {e}")
            return {
                'status': 'error',
                'message': str(e)
            }
    
    def get_spike_anomalies(self) -> Dict[str, Any]:
        """Get spike anomalies detected in issue frequency"""
        
        if not self.anomaly_if:
            return {
                'status': 'error',
                'message': 'Anomaly detection models not trained. Run: python train_anomaly_detection.py'
            }
        
        try:
            # Load data
            issues_df, buildings_df, _ = LocalDataLoader.load_sample_data()
            
            # Detect spike anomalies
            spike_anomalies = self.anomaly_if.detect_spike_anomalies(issues_df, buildings_df, window_days=7)
            
            return {
                'status': 'success',
                'timestamp': datetime.now().isoformat(),
                'spike_anomalies': spike_anomalies,
                'total_spikes': len(spike_anomalies),
                'critical_spikes': len([s for s in spike_anomalies if s['severity'] == 'CRITICAL']),
                'high_spikes': len([s for s in spike_anomalies if s['severity'] == 'HIGH'])
            }
        
        except Exception as e:
            logger.error(f"Error detecting spikes: {e}")
            return {
                'status': 'error',
                'message': str(e)
            }
    
    def get_temporal_anomalies(self) -> Dict[str, Any]:
        """Get temporal pattern anomalies"""
        
        if not self.anomaly_if:
            return {
                'status': 'error',
                'message': 'Anomaly detection models not trained. Run: python train_anomaly_detection.py'
            }
        
        try:
            # Load data
            issues_df, buildings_df, _ = LocalDataLoader.load_sample_data()
            
            # Detect temporal anomalies
            temporal_anomalies = self.anomaly_if.detect_temporal_anomalies(issues_df, buildings_df)
            
            return {
                'status': 'success',
                'timestamp': datetime.now().isoformat(),
                'temporal_anomalies': temporal_anomalies,
                'total_anomalies': len(temporal_anomalies),
                'critical_anomalies': len([t for t in temporal_anomalies if t['severity'] == 'CRITICAL']),
                'high_anomalies': len([t for t in temporal_anomalies if t['severity'] == 'HIGH'])
            }
        
        except Exception as e:
            logger.error(f"Error detecting temporal patterns: {e}")
            return {
                'status': 'error',
                'message': str(e)
            }


# ==================== Flask App Example ====================

app = Flask(__name__)
api = PredictionAPI()


@app.route('/api/ml/predictions', methods=['GET'])
def get_all_predictions():
    """GET /api/ml/predictions - Get all predictions"""
    return jsonify(api.get_predictions())


@app.route('/api/ml/predictions/<building_id>', methods=['GET'])
def get_building_prediction(building_id: str):
    """GET /api/ml/predictions/<building_id> - Get specific building prediction"""
    return jsonify(api.get_predictions_by_building(building_id))


@app.route('/api/ml/alerts', methods=['GET'])
def get_failure_alerts():
    """GET /api/ml/alerts - Get all active failure alerts"""
    return jsonify(api.get_alerts())


@app.route('/api/ml/risk-summary', methods=['GET'])
def get_risk_summary():
    """GET /api/ml/risk-summary - Get risk summary by level"""
    return jsonify(api.get_risk_summary())


@app.route('/api/ml/health', methods=['GET'])
def health_check():
    """GET /api/ml/health - Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'model_loaded': api.model.classifier is not None
    })


# ==================== Anomaly Detection Endpoints ====================

@app.route('/api/ml/anomalies', methods=['GET'])
def get_anomalies():
    """GET /api/ml/anomalies - Get all detected anomalies"""
    return jsonify(api.get_anomalies())


@app.route('/api/ml/anomalies/spikes', methods=['GET'])
def get_spike_anomalies():
    """GET /api/ml/anomalies/spikes - Get spike anomalies in issue frequency"""
    return jsonify(api.get_spike_anomalies())


@app.route('/api/ml/anomalies/temporal', methods=['GET'])
def get_temporal_anomalies():
    """GET /api/ml/anomalies/temporal - Get temporal pattern anomalies"""
    return jsonify(api.get_temporal_anomalies())


# ==================== Risk Probability Endpoints ====================

@app.route('/api/ml/risk', methods=['GET'])
def get_risk_scores():
    """GET /api/ml/risk - Get comprehensive risk probability scores"""
    if not api.risk_model:
        return jsonify({
            'status': 'error',
            'message': 'Risk model not trained. Run: python train_risk_probability.py'
        }), 503
    
    try:
        # Load data
        issues_df, buildings_df, _ = LocalDataLoader.load_sample_data()
        
        # Get predictions if available
        try:
            predictions_response = api.get_predictions()
            # Map both camelCase and snake_case keys from predictions
            failure_map = {}
            for p in predictions_response.get('predictions', []):
                building_id = p.get('building_id') or p.get('buildingId')
                failure_prob = p.get('failure_probability') or p.get('failureProbability')
                if building_id and failure_prob is not None:
                    failure_map[building_id] = failure_prob
        except Exception as e:
            logger.warning(f"Could not load predictions: {e}")
            failure_map = {}
        
        # Get anomalies if available
        try:
            anomalies_response = api.get_anomalies()
            # Map both camelCase and snake_case keys from anomalies
            anomaly_map = {}
            for a in anomalies_response.get('anomalies', []):
                building_id = a.get('building_id') or a.get('buildingId')
                anomaly_prob = a.get('anomaly_probability') or a.get('anomalyProbability')
                if building_id and anomaly_prob is not None:
                    anomaly_map[building_id] = anomaly_prob
        except Exception as e:
            logger.warning(f"Could not load anomalies: {e}")
            anomaly_map = {}
        
        # Calculate risk scores
        building_risks = []
        for building_id in buildings_df['id']:
            building_issues = issues_df[issues_df['building_id'] == building_id]
            
            recent_critical = len(building_issues[building_issues['severity'] >= 4])
            
            # Use square root scale normalized to 0-1 range
            # This provides better differentiation than log scale for high issue counts
            # Formula: sqrt(issues) / sqrt(max_expected_issues)
            # With max=100: 10 issues→32%, 25→50%, 50→71%, 75→87%, 100→100%
            num_issues = len(building_issues)
            if num_issues == 0:
                freq_score = 0.0
            else:
                max_expected_issues = 100
                freq_score = min(1.0, np.sqrt(num_issues) / np.sqrt(max_expected_issues))
            
            # Boost based on critical issue RATIO instead of absolute count
            # This rewards buildings with proportionally more critical issues
            if num_issues > 0:
                critical_ratio = recent_critical / num_issues
                # Add up to 20% boost for high critical ratios (>50% critical)
                critical_boost = min(0.2, critical_ratio * 0.4)
                freq_score = min(1.0, freq_score + critical_boost)
            
            risk_score = api.risk_model.calculate_building_risk(
                building_id=building_id,
                failure_probability=failure_map.get(building_id, 0.0),
                anomaly_probability=anomaly_map.get(building_id, 0.0),
                issue_frequency_score=freq_score,
                recent_high_severity_issues=recent_critical
            )
            building_risks.append(risk_score)
        
        # Sort by risk probability
        building_risks = sorted(building_risks, key=lambda x: x['risk_probability'], reverse=True)
        
        return jsonify({
            'status': 'success',
            'timestamp': datetime.now().isoformat(),
            'risk_scores': building_risks,
            'summary': {
                'total_buildings': len(building_risks),
                'critical_count': len([r for r in building_risks if r['risk_level'] == 'CRITICAL']),
                'high_count': len([r for r in building_risks if r['risk_level'] == 'HIGH']),
                'medium_count': len([r for r in building_risks if r['risk_level'] == 'MEDIUM']),
                'low_count': len([r for r in building_risks if r['risk_level'] == 'LOW'])
            }
        })
    
    except Exception as e:
        logger.error(f"Error getting risk scores: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@app.route('/api/ml/risk/category', methods=['GET'])
def get_category_risk():
    """GET /api/ml/risk/category - Get category-specific risk scores"""
    if not api.risk_model:
        return jsonify({
            'status': 'error',
            'message': 'Risk model not trained'
        }), 503
    
    try:
        issues_df, buildings_df, _ = LocalDataLoader.load_sample_data()
        category_risks = api.risk_model.calculate_category_risk(issues_df, buildings_df)
        
        return jsonify({
            'status': 'success',
            'timestamp': datetime.now().isoformat(),
            'category_risks': category_risks.to_dict('records'),
            'high_risk_categories': category_risks[
                category_risks['category_risk_score'] >= 0.6
            ]['category'].tolist()
        })
    
    except Exception as e:
        logger.error(f"Error getting category risk: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@app.route('/api/ml/risk/priority', methods=['GET'])
def get_priority_buildings():
    """GET /api/ml/risk/priority - Get buildings prioritized for maintenance"""
    if not api.risk_model:
        return jsonify({
            'status': 'error',
            'message': 'Risk model not trained'
        }), 503
    
    try:
        # Get risk scores
        issues_df, buildings_df, _ = LocalDataLoader.load_sample_data()
        
        # Get predictions if available
        try:
            predictions_response = api.get_predictions()
            failure_map = {}
            for p in predictions_response.get('predictions', []):
                building_id = p.get('building_id') or p.get('buildingId')
                failure_prob = p.get('failure_probability') or p.get('failureProbability')
                if building_id and failure_prob is not None:
                    failure_map[building_id] = failure_prob
        except Exception as e:
            logger.warning(f"Could not load predictions: {e}")
            failure_map = {}
        
        # Get anomalies if available
        try:
            anomalies_response = api.get_anomalies()
            anomaly_map = {}
            for a in anomalies_response.get('anomalies', []):
                building_id = a.get('building_id') or a.get('buildingId')
                anomaly_prob = a.get('anomaly_probability') or a.get('anomalyProbability')
                if building_id and anomaly_prob is not None:
                    anomaly_map[building_id] = anomaly_prob
        except Exception as e:
            logger.warning(f"Could not load anomalies: {e}")
            anomaly_map = {}
        
        building_risks = []
        for building_id in buildings_df['id']:
            building_issues = issues_df[issues_df['building_id'] == building_id]
            recent_critical = len(building_issues[building_issues['severity'] >= 4])
            
            # Use square root scale for better differentiation
            num_issues = len(building_issues)
            if num_issues == 0:
                freq_score = 0.0
            else:
                max_expected_issues = 100
                freq_score = min(1.0, np.sqrt(num_issues) / np.sqrt(max_expected_issues))
            
            # Boost based on critical issue ratio
            if num_issues > 0:
                critical_ratio = recent_critical / num_issues
                critical_boost = min(0.2, critical_ratio * 0.4)
                freq_score = min(1.0, freq_score + critical_boost)
            
            risk_score = api.risk_model.calculate_building_risk(
                building_id=building_id,
                failure_probability=failure_map.get(building_id, 0.0),
                anomaly_probability=anomaly_map.get(building_id, 0.0),
                issue_frequency_score=freq_score,
                recent_high_severity_issues=recent_critical
            )
            building_risks.append(risk_score)
        
        # Get priority list
        priority_buildings = api.risk_model.prioritize_buildings(building_risks, top_n=10)
        
        return jsonify({
            'status': 'success',
            'timestamp': datetime.now().isoformat(),
            'priority_buildings': priority_buildings,
            'total_critical': len([r for r in priority_buildings if r['risk_level'] == 'CRITICAL'])
        })
    
    except Exception as e:
        logger.error(f"Error getting priority buildings: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@app.route('/api/ml/risk/report', methods=['GET'])
def get_risk_report():
    """GET /api/ml/risk/report - Get comprehensive risk assessment report"""
    if not api.risk_model:
        return jsonify({
            'status': 'error',
            'message': 'Risk model not trained'
        }), 503
    
    try:
        # Try to load cached report
        if os.path.exists('models/risk_assessment_report.json'):
            with open('models/risk_assessment_report.json', 'r') as f:
                report = json.load(f)
            
            return jsonify({
                'status': 'success',
                'timestamp': datetime.now().isoformat(),
                'report': report
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Risk report not available. Run: python train_risk_probability.py'
            }), 503
    
    except Exception as e:
        logger.error(f"Error getting risk report: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500



# ==================== Integration with Express ====================

INTEGRATION_EXAMPLE = """
// TypeScript Express Integration Example
// Add this to your backend route handler

import axios from 'axios';

interface FailurePrediction {
  buildingId: string;
  buildingName: string;
  failureProbability: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedDaysToFailure: number;
  primaryConcern: string;
  actionRequired: boolean;
}

interface PredictionResponse {
  status: 'success' | 'error';
  predictions: FailurePrediction[];
  summary: {
    totalBuildings: number;
    criticalCount: number;
    highRiskCount: number;
    actionRequired: number;
  };
}

class MLService {
  private mlApiUrl = process.env.ML_API_URL || 'http://localhost:5000/api/ml';
  
  async getFailurePredictions(): Promise<PredictionResponse> {
    try {
      const response = await axios.get(`${this.mlApiUrl}/predictions`);
      return response.data;
    } catch (error) {
      console.error('Failed to get predictions:', error);
      throw error;
    }
  }
  
  async getBuildingPrediction(buildingId: string): Promise<FailurePrediction> {
    try {
      const response = await axios.get(
        `${this.mlApiUrl}/predictions/${buildingId}`
      );
      return response.data.prediction;
    } catch (error) {
      console.error(`Failed to get prediction for ${buildingId}:`, error);
      throw error;
    }
  }
  
  async getFailureAlerts() {
    try {
      const response = await axios.get(`${this.mlApiUrl}/alerts`);
      return response.data;
    } catch (error) {
      console.error('Failed to get alerts:', error);
      throw error;
    }
  }
}

// Usage in Express route
app.get('/api/dashboard/at-risk-buildings', async (req, res) => {
  try {
    const mlService = new MLService();
    const predictions = await mlService.getFailurePredictions();
    
    res.json({
      status: 'success',
      data: predictions.predictions.filter(p => p.actionRequired),
      summary: predictions.summary
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch predictions'
    });
  }
});
"""


if __name__ == '__main__':
    # Run Flask app
    logger.info("Starting ML API server...")
    app.run(host='0.0.0.0', port=5000, debug=False)
