"""
Anomaly Detection Model Module
Detects unusual patterns in building issue data using multiple algorithms
"""

import pandas as pd
import numpy as np
from typing import Dict, Tuple, List, Any
from datetime import datetime, timedelta
from sklearn.ensemble import IsolationForest
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import joblib
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AnomalyDetectionModel:
    """Anomaly detection for building issue patterns"""
    
    def __init__(self, algorithm: str = 'isolation_forest', contamination: float = 0.1):
        """
        Initialize anomaly detection model
        
        Args:
            algorithm: 'isolation_forest' or 'one_class_svm'
            contamination: Expected proportion of anomalies (0.0-0.5)
        """
        self.algorithm = algorithm
        self.contamination = contamination
        self.scaler = StandardScaler()
        self.model = None
        self.feature_names = []
        
        if algorithm == 'isolation_forest':
            self.model = IsolationForest(
                contamination=contamination,
                random_state=42,
                n_estimators=100
            )
            logger.info(f"✓ Initialized Isolation Forest (contamination={contamination})")
        elif algorithm == 'one_class_svm':
            self.model = OneClassSVM(
                kernel='rbf',
                gamma='auto',
                nu=contamination  # nu is similar to contamination
            )
            logger.info(f"✓ Initialized One-Class SVM (nu={contamination})")
        else:
            raise ValueError(f"Unknown algorithm: {algorithm}")
    
    def train(self, X: pd.DataFrame) -> Dict[str, Any]:
        """
        Train anomaly detection model
        
        Args:
            X: Features (unlabeled, used to find anomalies)
            
        Returns:
            Dictionary with training statistics
        """
        try:
            logger.info(f"Training {self.algorithm} on {len(X)} samples...")
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            self.feature_names = X.columns.tolist()
            
            # Train model
            self.model.fit(X_scaled)
            
            # Get predictions and scores
            predictions = self.model.predict(X_scaled)  # -1 for anomaly, 1 for normal
            anomaly_scores = self.model.score_samples(X_scaled)  # Lower = more anomalous
            
            n_anomalies = (predictions == -1).sum()
            n_normal = (predictions == 1).sum()
            
            logger.info(f"✓ Model trained successfully")
            logger.info(f"  Normal samples: {n_normal} ({100*n_normal/len(X):.1f}%)")
            logger.info(f"  Anomalies: {n_anomalies} ({100*n_anomalies/len(X):.1f}%)")
            logger.info(f"  Mean anomaly score: {anomaly_scores.mean():.4f}")
            logger.info(f"  Std anomaly score: {anomaly_scores.std():.4f}")
            
            return {
                'n_samples': len(X),
                'n_features': X.shape[1],
                'n_anomalies': n_anomalies,
                'n_normal': n_normal,
                'mean_anomaly_score': float(anomaly_scores.mean()),
                'std_anomaly_score': float(anomaly_scores.std()),
                'min_anomaly_score': float(anomaly_scores.min()),
                'max_anomaly_score': float(anomaly_scores.max())
            }
            
        except Exception as e:
            logger.error(f"✗ Error training model: {e}")
            raise
    
    def detect_anomalies(self, X: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Detect anomalies in data
        
        Args:
            X: Features to test
            
        Returns:
            Tuple of (predictions, anomaly_scores, anomaly_probability)
            - predictions: -1 for anomaly, 1 for normal
            - anomaly_scores: Raw anomaly scores (lower = more anomalous)
            - anomaly_probability: 0.0-1.0 probability of being anomalous
        """
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        try:
            X_scaled = self.scaler.transform(X)
            predictions = self.model.predict(X_scaled)
            anomaly_scores = self.model.score_samples(X_scaled)
            
            # Normalize scores to 0-1 probability
            # Lower scores = more anomalous, so we invert
            min_score = anomaly_scores.min()
            max_score = anomaly_scores.max()
            
            if max_score - min_score > 0:
                anomaly_prob = 1.0 - (anomaly_scores - min_score) / (max_score - min_score)
            else:
                anomaly_prob = np.zeros_like(anomaly_scores)
            
            return predictions, anomaly_scores, anomaly_prob
            
        except Exception as e:
            logger.error(f"✗ Error detecting anomalies: {e}")
            raise
    
    def detect_spike_anomalies(self, 
                               issues_df: pd.DataFrame, 
                               buildings_df: pd.DataFrame,
                               window_days: int = 7,
                               threshold: float = 2.0) -> List[Dict[str, Any]]:
        """
        Detect spike anomalies (sudden increases in issue frequency)
        
        Args:
            issues_df: DataFrame with issues and created_at dates
            buildings_df: DataFrame with building info
            window_days: Rolling window size for frequency calculation
            threshold: Std dev multiplier for spike detection (>2.0 = anomaly)
            
        Returns:
            List of detected spike anomalies
        """
        try:
            anomalies = []
            
            for building_id in buildings_df['id']:
                building_issues = issues_df[issues_df['building_id'] == building_id].copy()
                
                if len(building_issues) < window_days:
                    continue
                
                # Sort by date
                building_issues['created_at'] = pd.to_datetime(building_issues['created_at'])
                building_issues = building_issues.sort_values('created_at')
                
                # Create time series of issue counts
                date_range = pd.date_range(
                    start=building_issues['created_at'].min(),
                    end=building_issues['created_at'].max(),
                    freq='D'
                )
                
                daily_counts = []
                for date in date_range:
                    count = len(building_issues[
                        (building_issues['created_at'].dt.date == date.date())
                    ])
                    daily_counts.append(count)
                
                daily_counts = np.array(daily_counts)
                
                if len(daily_counts) < window_days * 2:
                    continue
                
                # Calculate rolling mean and std
                rolling_mean = pd.Series(daily_counts).rolling(window=window_days, center=True).mean()
                rolling_std = pd.Series(daily_counts).rolling(window=window_days, center=True).std()
                
                # Detect spikes
                for i in range(window_days, len(daily_counts) - window_days):
                    if pd.isna(rolling_std.iloc[i]) or rolling_std.iloc[i] == 0:
                        continue
                    
                    z_score = (daily_counts[i] - rolling_mean.iloc[i]) / rolling_std.iloc[i]
                    
                    if abs(z_score) > threshold:
                        anomaly_date = date_range[i]
                        anomalies.append({
                            'building_id': building_id,
                            'anomaly_type': 'frequency_spike',
                            'anomaly_date': anomaly_date,
                            'daily_count': int(daily_counts[i]),
                            'expected_count': float(rolling_mean.iloc[i]),
                            'z_score': float(z_score),
                            'severity': 'CRITICAL' if abs(z_score) > 3 else 'HIGH'
                        })
            
            logger.info(f"✓ Detected {len(anomalies)} spike anomalies")
            return anomalies
            
        except Exception as e:
            logger.error(f"✗ Error detecting spike anomalies: {e}")
            raise
    
    def detect_temporal_anomalies(self, 
                                  issues_df: pd.DataFrame,
                                  buildings_df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Detect temporal pattern anomalies (unusual timing patterns)
        
        Args:
            issues_df: DataFrame with issues
            buildings_df: DataFrame with buildings
            
        Returns:
            List of detected temporal anomalies
        """
        try:
            anomalies = []
            
            for building_id in buildings_df['id']:
                building_issues = issues_df[issues_df['building_id'] == building_id].copy()
                
                if len(building_issues) < 5:
                    continue
                
                # Calculate inter-arrival times
                building_issues['created_at'] = pd.to_datetime(building_issues['created_at'])
                building_issues = building_issues.sort_values('created_at')
                
                arrival_times = building_issues['created_at'].values
                inter_arrival_times = np.diff(arrival_times).astype('timedelta64[h]').astype(float)
                
                if len(inter_arrival_times) < 2:
                    continue
                
                # Calculate statistics
                mean_time = np.mean(inter_arrival_times)
                std_time = np.std(inter_arrival_times)
                
                # Detect anomalies (very short inter-arrival times)
                for i, time_diff in enumerate(inter_arrival_times):
                    if std_time == 0:
                        continue
                    
                    z_score = (time_diff - mean_time) / std_time
                    
                    if z_score < -2.0:  # Much shorter than usual
                        anomalies.append({
                            'building_id': building_id,
                            'anomaly_type': 'temporal_clustering',
                            'time_index': i,
                            'inter_arrival_hours': float(time_diff),
                            'expected_hours': float(mean_time),
                            'z_score': float(z_score),
                            'severity': 'HIGH' if z_score < -3 else 'MEDIUM'
                        })
            
            logger.info(f"✓ Detected {len(anomalies)} temporal anomalies")
            return anomalies
            
        except Exception as e:
            logger.error(f"✗ Error detecting temporal anomalies: {e}")
            raise
    
    def get_feature_importance(self) -> pd.DataFrame:
        """Get feature importance for anomalies"""
        if not isinstance(self.model, IsolationForest):
            logger.warning("Feature importance only available for Isolation Forest")
            return pd.DataFrame()
        
        try:
            # Get feature importances from isolation forest
            importances = self.model.feature_importances_
            
            importance_df = pd.DataFrame({
                'feature': self.feature_names,
                'importance': importances
            }).sort_values('importance', ascending=False)
            
            return importance_df
            
        except Exception as e:
            logger.error(f"✗ Error getting feature importance: {e}")
            return pd.DataFrame()
    
    def save_model(self, model_path: str = 'models/anomaly_detection_model.pkl',
                   scaler_path: str = 'models/anomaly_scaler.pkl') -> None:
        """Save model and scaler"""
        try:
            joblib.dump(self.model, model_path)
            joblib.dump(self.scaler, scaler_path)
            logger.info(f"✓ Model saved to {model_path}")
            logger.info(f"✓ Scaler saved to {scaler_path}")
        except Exception as e:
            logger.error(f"✗ Error saving model: {e}")
            raise
    
    def load_model(self, model_path: str = 'models/anomaly_detection_model.pkl',
                   scaler_path: str = 'models/anomaly_scaler.pkl') -> None:
        """Load model and scaler"""
        try:
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            logger.info(f"✓ Model loaded from {model_path}")
        except Exception as e:
            logger.error(f"✗ Error loading model: {e}")
            raise


class AnomalyFeatureEngineer:
    """Engineer features specifically for anomaly detection"""
    
    @staticmethod
    def engineer_anomaly_features(issues_df: pd.DataFrame, 
                                  buildings_df: pd.DataFrame) -> pd.DataFrame:
        """
        Engineer features for anomaly detection
        
        Args:
            issues_df: DataFrame with issues
            buildings_df: DataFrame with buildings
            
        Returns:
            DataFrame with anomaly detection features
        """
        features = buildings_df.copy()
        
        for building_id in features['id']:
            building_issues = issues_df[issues_df['building_id'] == building_id]
            
            if len(building_issues) == 0:
                # Set default values for buildings with no issues
                features.loc[features['id'] == building_id, 'issue_frequency_variance'] = 0
                features.loc[features['id'] == building_id, 'issue_severity_variance'] = 0
                features.loc[features['id'] == building_id, 'inter_arrival_variance'] = 0
                features.loc[features['id'] == building_id, 'daily_issue_std'] = 0
                features.loc[features['id'] == building_id, 'weekly_issue_coefficient_variation'] = 0
                continue
            
            # Issue frequency variance (how much does frequency vary?)
            building_issues['created_at'] = pd.to_datetime(building_issues['created_at'])
            daily_counts = building_issues.groupby(building_issues['created_at'].dt.date).size()
            frequency_variance = daily_counts.std() / (daily_counts.mean() + 1)  # Coefficient of variation
            
            # Severity variance
            severity_variance = building_issues['severity'].std() / (building_issues['severity'].mean() + 1)
            
            # Inter-arrival time variance
            if len(building_issues) > 1:
                sorted_issues = building_issues.sort_values('created_at')
                inter_arrivals = np.diff(sorted_issues['created_at'].values).astype('timedelta64[h]').astype(float)
                inter_arrival_var = np.std(inter_arrivals) / (np.mean(inter_arrivals) + 1)
            else:
                inter_arrival_var = 0
            
            # Daily issue count standard deviation
            daily_std = daily_counts.std()
            
            # Weekly coefficient of variation
            weekly_counts = building_issues.groupby(building_issues['created_at'].dt.isocalendar().week).size()
            if len(weekly_counts) > 1:
                weekly_cv = weekly_counts.std() / (weekly_counts.mean() + 1)
            else:
                weekly_cv = 0
            
            # Update features
            features.loc[features['id'] == building_id, 'issue_frequency_variance'] = frequency_variance
            features.loc[features['id'] == building_id, 'issue_severity_variance'] = severity_variance
            features.loc[features['id'] == building_id, 'inter_arrival_variance'] = inter_arrival_var
            features.loc[features['id'] == building_id, 'daily_issue_std'] = daily_std
            features.loc[features['id'] == building_id, 'weekly_issue_coefficient_variation'] = weekly_cv
        
        logger.info(f"✓ Engineered {len(features.columns)} anomaly detection features")
        return features
