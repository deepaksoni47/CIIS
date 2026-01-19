"""
Feature Engineering Module
Extract predictive features from building and issue data
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Tuple, Dict, List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FeatureEngineer:
    """Extract and engineer features for failure prediction"""
    
    def __init__(self):
        """Initialize feature engineer"""
        self.feature_names = []
    
    def engineer_building_features(self, 
                                   issues_df: pd.DataFrame, 
                                   buildings_df: pd.DataFrame,
                                   time_windows: List[int] = [7, 14, 30, 90]) -> pd.DataFrame:
        """
        Engineer features at building level
        
        Args:
            issues_df: DataFrame with issue history
            buildings_df: DataFrame with building info
            time_windows: Days for rolling window features
            
        Returns:
            DataFrame with engineered features
        """
        
        # Start with building base data
        features = buildings_df.copy()
        
        # Current status features
        features['open_issues_count'] = features['id'].apply(
            lambda bid: len(issues_df[(issues_df['building_id'] == bid) & 
                                      (issues_df['status'] == 'OPEN')])
        )
        
        # Historical issue frequency
        features['avg_issues_per_month'] = features['total_issues'] / 12  # Assuming 1 year of data
        
        # Severity pattern
        features['high_severity_ratio'] = features['id'].apply(
            lambda bid: len(issues_df[(issues_df['building_id'] == bid) & 
                                      (issues_df['severity'] >= 4)]) / 
                       max(len(issues_df[issues_df['building_id'] == bid]), 1)
        )
        
        # Category distribution (one-hot encoded)
        for category in ['WATER', 'ELECTRICITY', 'WIFI', 'SANITATION', 'TEMPERATURE']:
            features[f'{category.lower()}_issue_count'] = features['id'].apply(
                lambda bid: len(issues_df[(issues_df['building_id'] == bid) & 
                                          (issues_df['category'] == category)])
            )
        
        # Time-based features
        if 'last_issue_date' in features.columns:
            features['days_since_last_issue'] = (
                datetime.now() - pd.to_datetime(features['last_issue_date'])
            ).dt.days
            features['days_since_last_issue'].fillna(999, inplace=True)
        
        # Issue resolution pattern
        features['avg_resolution_time_days'] = features['id'].apply(
            lambda bid: self._calculate_avg_resolution_time(
                issues_df[issues_df['building_id'] == bid]
            )
        )
        
        # Recency-weighted issue score (recent issues weighted higher)
        features['recency_weighted_issue_score'] = features['id'].apply(
            lambda bid: self._calculate_recency_weighted_score(
                issues_df[issues_df['building_id'] == bid]
            )
        )
        
        # Issue clustering (temporal concentration)
        features['issue_clustering_score'] = features['id'].apply(
            lambda bid: self._calculate_clustering_score(
                issues_df[issues_df['building_id'] == bid]
            )
        )
        
        # Rolling window features
        for window in time_windows:
            cutoff_date = datetime.now() - timedelta(days=window)
            recent_issues = issues_df[pd.to_datetime(issues_df['created_at']) >= cutoff_date]
            
            features[f'issues_last_{window}d'] = features['id'].apply(
                lambda bid: len(recent_issues[recent_issues['building_id'] == bid])
            )
            
            features[f'avg_severity_last_{window}d'] = features['id'].apply(
                lambda bid: recent_issues[recent_issues['building_id'] == bid]['severity'].mean()
            )
            features[f'avg_severity_last_{window}d'].fillna(0, inplace=True)
        
        # Fill NaN values
        features.fillna(0, inplace=True)
        
        logger.info(f"✓ Engineered {len(features.columns)} features for {len(features)} buildings")
        
        return features
    
    def engineer_category_features(self,
                                   issues_df: pd.DataFrame,
                                   buildings_df: pd.DataFrame,
                                   category: str = 'WATER') -> pd.DataFrame:
        """
        Engineer features specific to a category
        
        Args:
            issues_df: Issue history
            buildings_df: Building info
            category: Issue category to focus on
            
        Returns:
            Features for category-specific prediction
        """
        
        category_issues = issues_df[issues_df['category'] == category]
        features = buildings_df.copy()
        
        # Category-specific counts
        features[f'{category}_total_count'] = features['id'].apply(
            lambda bid: len(category_issues[category_issues['building_id'] == bid])
        )
        
        features[f'{category}_open_count'] = features['id'].apply(
            lambda bid: len(category_issues[(category_issues['building_id'] == bid) & 
                                            (category_issues['status'] == 'OPEN')])
        )
        
        # Average severity for category
        features[f'{category}_avg_severity'] = features['id'].apply(
            lambda bid: category_issues[category_issues['building_id'] == bid]['severity'].mean()
        )
        features[f'{category}_avg_severity'].fillna(0, inplace=True)
        
        # Recurrence pattern
        features[f'{category}_recurrence_rate'] = features['id'].apply(
            lambda bid: self._calculate_recurrence_rate(
                category_issues[category_issues['building_id'] == bid]
            )
        )
        
        # Time since last occurrence
        features[f'{category}_days_since_last'] = features['id'].apply(
            lambda bid: self._days_since_last_occurrence(
                category_issues[category_issues['building_id'] == bid]
            )
        )
        
        features.fillna(0, inplace=True)
        
        return features
    
    @staticmethod
    def _calculate_avg_resolution_time(building_issues: pd.DataFrame) -> float:
        """Calculate average resolution time in days"""
        if 'resolution_days' not in building_issues.columns or len(building_issues) == 0:
            return 0
        
        return building_issues['resolution_days'].mean()
    
    @staticmethod
    def _calculate_recency_weighted_score(building_issues: pd.DataFrame) -> float:
        """
        Calculate recency-weighted issue score
        Recent issues weighted more heavily than old ones
        """
        if len(building_issues) == 0:
            return 0
        
        building_issues = building_issues.copy()
        building_issues['created_at'] = pd.to_datetime(building_issues['created_at'])
        building_issues['days_ago'] = (datetime.now() - building_issues['created_at']).dt.days
        
        # Weight by exponential decay
        building_issues['weight'] = np.exp(-building_issues['days_ago'] / 30)
        
        return (building_issues['severity'] * building_issues['weight']).sum() / building_issues['weight'].sum()
    
    @staticmethod
    def _calculate_clustering_score(building_issues: pd.DataFrame) -> float:
        """
        Calculate issue clustering (concentration in time)
        High clustering means issues happen in bursts
        """
        if len(building_issues) < 2:
            return 0
        
        building_issues = building_issues.copy()
        building_issues['created_at'] = pd.to_datetime(building_issues['created_at'])
        building_issues = building_issues.sort_values('created_at')
        
        # Calculate time differences between consecutive issues
        time_diffs = building_issues['created_at'].diff().dt.days.dropna()
        
        if len(time_diffs) == 0:
            return 0
        
        # Coefficient of variation (std / mean) indicates clustering
        return time_diffs.std() / (time_diffs.mean() + 1)  # +1 to avoid division by zero
    
    @staticmethod
    def _calculate_recurrence_rate(category_issues: pd.DataFrame) -> float:
        """Calculate how often issues of this category recur in the same building"""
        if len(category_issues) < 2:
            return 0
        
        # If building has multiple issues of same category, calculate time between them
        category_issues = category_issues.copy()
        category_issues['created_at'] = pd.to_datetime(category_issues['created_at'])
        category_issues = category_issues.sort_values('created_at')
        
        time_diffs = category_issues['created_at'].diff().dt.days.dropna()
        
        if len(time_diffs) == 0:
            return 0
        
        # Return inverse of average days between issues (issues per day)
        return 1 / (time_diffs.mean() + 1)
    
    @staticmethod
    def _days_since_last_occurrence(category_issues: pd.DataFrame) -> float:
        """Days since last issue of this category"""
        if len(category_issues) == 0:
            return 999
        
        category_issues = category_issues.copy()
        category_issues['created_at'] = pd.to_datetime(category_issues['created_at'])
        
        last_date = category_issues['created_at'].max()
        
        return (datetime.now() - last_date).days
    
    def create_training_dataset(self,
                                issues_df: pd.DataFrame,
                                buildings_df: pd.DataFrame,
                                target_window_days: int = 30) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Create training dataset with labels
        
        Args:
            issues_df: Full issue history
            buildings_df: Building information
            target_window_days: Days ahead to predict failure
            
        Returns:
            Tuple of (features, targets)
        """
        
        # Engineer features
        features = self.engineer_building_features(issues_df, buildings_df)
        
        # Create target labels - did building have failure in next window?
        targets = []
        
        for building_id in features['id']:
            building_issues = issues_df[issues_df['building_id'] == building_id]
            
            if len(building_issues) == 0:
                targets.append(0)
                continue
            
            # Sort by date
            building_issues = building_issues.copy()
            building_issues['created_at'] = pd.to_datetime(building_issues['created_at'])
            building_issues = building_issues.sort_values('created_at')
            
            # Check if there's a failure in the target window
            future_date = datetime.now() + timedelta(days=target_window_days)
            future_issues = building_issues[
                (building_issues['created_at'] > datetime.now()) &
                (building_issues['created_at'] <= future_date)
            ]
            
            # Mark as failure if high severity issues in future window
            has_failure = len(future_issues[future_issues['severity'] >= 4]) > 0
            targets.append(1 if has_failure else 0)
        
        features['failure_in_window'] = targets
        
        logger.info(f"✓ Created training dataset with {len(features)} samples")
        logger.info(f"  Positive class (failures): {sum(targets)} ({100*sum(targets)/len(targets):.1f}%)")
        
        return features, features['failure_in_window']
