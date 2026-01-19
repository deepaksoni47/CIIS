"""
Failure Prediction Model
Predict which buildings will fail and when
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Tuple, Dict, List, Optional
import logging
import joblib
import os

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score, 
    roc_curve, precision_recall_curve, f1_score
)
import matplotlib.pyplot as plt
import seaborn as sns

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FailurePredictionModel:
    """
    Machine Learning model for predicting building failures
    
    This model predicts:
    1. Which buildings will fail next (binary classification)
    2. Time window estimation (regression component)
    """
    
    def __init__(self, model_type: str = 'xgboost'):
        """
        Initialize prediction model
        
        Args:
            model_type: Type of model - 'xgboost', 'random_forest', or 'gradient_boosting'
        """
        self.model_type = model_type
        self.classifier = None
        self.scaler = StandardScaler()
        self.feature_names = []
        self.model_path = 'models/failure_prediction_model.pkl'
        self.scaler_path = 'models/failure_scaler.pkl'
        
        # Create models directory
        os.makedirs('models', exist_ok=True)
        
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the classifier"""
        if self.model_type == 'xgboost':
            self.classifier = XGBClassifier(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                scale_pos_weight=3,  # Handle class imbalance
                objective='binary:logistic',
                eval_metric='logloss'
            )
        elif self.model_type == 'random_forest':
            self.classifier = RandomForestClassifier(
                n_estimators=100,
                max_depth=15,
                min_samples_split=5,
                min_samples_leaf=2,
                class_weight='balanced',
                random_state=42,
                n_jobs=-1
            )
        elif self.model_type == 'gradient_boosting':
            self.classifier = GradientBoostingClassifier(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.1,
                subsample=0.8,
                random_state=42
            )
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")
        
        logger.info(f"✓ Initialized {self.model_type} model")
    
    def prepare_data(self, 
                    features_df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Prepare features for training
        
        Args:
            features_df: DataFrame with features and target
            
        Returns:
            Tuple of (processed_features, target)
        """
        
        # Separate features and target
        if 'failure_in_window' not in features_df.columns:
            raise ValueError("Target column 'failure_in_window' not found")
        
        # Keep only numeric features
        numeric_cols = features_df.select_dtypes(include=[np.number]).columns
        numeric_cols = [col for col in numeric_cols if col != 'failure_in_window']
        
        X = features_df[numeric_cols].copy()
        y = features_df['failure_in_window'].copy()
        
        # Handle missing values
        X.fillna(0, inplace=True)
        
        # Remove infinities
        X = X.replace([np.inf, -np.inf], 0)
        
        self.feature_names = X.columns.tolist()
        
        logger.info(f"✓ Prepared data with {len(X)} samples and {len(X.columns)} features")
        logger.info(f"  Class distribution - Failures: {y.sum()} ({100*y.sum()/len(y):.1f}%)")
        
        return X, y
    
    def train(self, 
              X_train: pd.DataFrame, 
              y_train: pd.Series,
              X_val: Optional[pd.DataFrame] = None,
              y_val: Optional[pd.Series] = None) -> Dict:
        """
        Train the model
        
        Args:
            X_train: Training features
            y_train: Training labels
            X_val: Validation features (optional)
            y_val: Validation labels (optional)
            
        Returns:
            Dictionary with training metrics
        """
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        
        logger.info(f"Training {self.model_type} model...")
        
        # Train model
        if X_val is not None and y_val is not None:
            X_val_scaled = self.scaler.transform(X_val)
            
            if self.model_type == 'xgboost':
                self.classifier.fit(
                    X_train_scaled, y_train,
                    eval_set=[(X_val_scaled, y_val)],
                    verbose=False
                )
            else:
                self.classifier.fit(X_train_scaled, y_train)
        else:
            self.classifier.fit(X_train_scaled, y_train)
        
        # Calculate metrics
        y_pred_train = self.classifier.predict(X_train_scaled)
        y_pred_proba_train = self.classifier.predict_proba(X_train_scaled)[:, 1]
        
        metrics = {}
        
        # Calculate training metrics (handle case where only one class present)
        try:
            metrics['train_f1'] = f1_score(y_train, y_pred_train, zero_division=0)
            metrics['train_auc'] = roc_auc_score(y_train, y_pred_proba_train)
        except ValueError:
            # If only one class in training set, skip AUC
            metrics['train_f1'] = f1_score(y_train, y_pred_train, zero_division=0)
            metrics['train_auc'] = 0.0
        
        if X_val is not None and y_val is not None:
            X_val_scaled = self.scaler.transform(X_val)
            y_pred_val = self.classifier.predict(X_val_scaled)
            y_pred_proba_val = self.classifier.predict_proba(X_val_scaled)[:, 1]
            
            try:
                metrics['val_f1'] = f1_score(y_val, y_pred_val, zero_division=0)
                metrics['val_auc'] = roc_auc_score(y_val, y_pred_proba_val)
            except ValueError:
                # If only one class in validation set, skip AUC
                metrics['val_f1'] = f1_score(y_val, y_pred_val, zero_division=0)
                metrics['val_auc'] = 0.0
        
        logger.info(f"✓ Model trained successfully")
        logger.info(f"  Train F1: {metrics['train_f1']:.4f}, AUC: {metrics['train_auc']:.4f}")
        if 'val_f1' in metrics:
            logger.info(f"  Val F1: {metrics['val_f1']:.4f}, AUC: {metrics['val_auc']:.4f}")
        
        return metrics
    
    def predict_failure_risk(self, X: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Predict failure risk for buildings
        
        Args:
            X: Building features
            
        Returns:
            Tuple of (binary_predictions, probability_predictions)
        """
        
        X_scaled = self.scaler.transform(X)
        
        predictions = self.classifier.predict(X_scaled)
        probabilities = self.classifier.predict_proba(X_scaled)[:, 1]
        
        return predictions, probabilities
    
    def predict_time_window(self, 
                           X: pd.DataFrame,
                           issues_df: pd.DataFrame,
                           buildings_df: pd.DataFrame) -> Dict:
        """
        Estimate time window for potential failure
        
        Args:
            X: Building features
            issues_df: Historical issues
            buildings_df: Building information
            
        Returns:
            Dictionary with time predictions
        """
        
        predictions, probabilities = self.predict_failure_risk(X)
        
        results = []
        
        for idx, (building_id, prob) in enumerate(zip(buildings_df['id'], probabilities)):
            building_issues = issues_df[issues_df['building_id'] == building_id]
            
            if len(building_issues) == 0:
                continue
            
            # Estimate days to failure based on recency and pattern
            days_since_last = X.iloc[idx].get('days_since_last_issue', 999)
            avg_resolution_time = X.iloc[idx].get('avg_resolution_time_days', 14)
            recency_score = X.iloc[idx].get('recency_weighted_issue_score', 0)
            
            # Estimate window
            if prob > 0.7:
                estimated_days = min(int(days_since_last * 0.5), 30)
            elif prob > 0.5:
                estimated_days = min(int(days_since_last * 0.7), 45)
            else:
                estimated_days = min(int(days_since_last), 60)
            
            results.append({
                'building_id': building_id,
                'building_name': buildings_df[buildings_df['id'] == building_id]['name'].values[0],
                'failure_probability': float(prob),
                'failure_risk_level': self._categorize_risk(prob),
                'estimated_days_to_failure': estimated_days,
                'confidence': float(np.clip(abs(prob - 0.5) * 2, 0, 1)),
                'primary_concern': self._get_primary_concern(building_issues),
            })
        
        return results
    
    @staticmethod
    def _categorize_risk(probability: float) -> str:
        """Categorize risk level based on probability"""
        if probability >= 0.8:
            return 'CRITICAL'
        elif probability >= 0.6:
            return 'HIGH'
        elif probability >= 0.4:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    @staticmethod
    def _get_primary_concern(building_issues: pd.DataFrame) -> str:
        """Identify primary issue category for a building"""
        if len(building_issues) == 0:
            return 'UNKNOWN'
        
        # Find most common high-severity category
        high_sev = building_issues[building_issues['severity'] >= 4]
        if len(high_sev) > 0:
            return high_sev['category'].mode()[0]
        
        return building_issues['category'].mode()[0]
    
    def get_feature_importance(self) -> pd.DataFrame:
        """Get feature importance from the model"""
        
        if self.model_type == 'xgboost':
            importance = self.classifier.feature_importances_
        elif self.model_type in ['random_forest', 'gradient_boosting']:
            importance = self.classifier.feature_importances_
        else:
            return pd.DataFrame()
        
        importance_df = pd.DataFrame({
            'feature': self.feature_names,
            'importance': importance
        }).sort_values('importance', ascending=False)
        
        return importance_df
    
    def plot_feature_importance(self, top_n: int = 15) -> None:
        """Plot feature importance"""
        
        importance_df = self.get_feature_importance()
        
        plt.figure(figsize=(10, 6))
        sns.barplot(data=importance_df.head(top_n), x='importance', y='feature', palette='viridis')
        plt.title(f'Top {top_n} Feature Importances - Failure Prediction')
        plt.xlabel('Importance Score')
        plt.tight_layout()
        plt.savefig('models/feature_importance.png', dpi=100)
        logger.info("✓ Saved feature importance plot to models/feature_importance.png")
        plt.close()
    
    def plot_roc_curve(self, y_true: np.ndarray, y_pred_proba: np.ndarray) -> None:
        """Plot ROC curve"""
        
        fpr, tpr, _ = roc_curve(y_true, y_pred_proba)
        auc = roc_auc_score(y_true, y_pred_proba)
        
        plt.figure(figsize=(8, 6))
        plt.plot(fpr, tpr, label=f'ROC Curve (AUC = {auc:.3f})', linewidth=2)
        plt.plot([0, 1], [0, 1], 'k--', label='Random Classifier')
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title('ROC Curve - Failure Prediction')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig('models/roc_curve.png', dpi=100)
        logger.info("✓ Saved ROC curve to models/roc_curve.png")
        plt.close()
    
    def save_model(self) -> None:
        """Save trained model and scaler"""
        joblib.dump(self.classifier, self.model_path)
        joblib.dump(self.scaler, self.scaler_path)
        logger.info(f"✓ Model saved to {self.model_path}")
        logger.info(f"✓ Scaler saved to {self.scaler_path}")
    
    def load_model(self) -> bool:
        """Load saved model and scaler"""
        if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
            self.classifier = joblib.load(self.model_path)
            self.scaler = joblib.load(self.scaler_path)
            logger.info(f"✓ Loaded model from {self.model_path}")
            return True
        return False
