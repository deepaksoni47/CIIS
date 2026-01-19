"""
Data Loading Module - Firebase/Firestore Support
Handles Firebase Firestore connections and data queries
"""

import os
from typing import Optional, Tuple, List, Dict, Any
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from dotenv import load_dotenv
import logging
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    logger.warning("⚠ firebase-admin not installed. Install with: pip install firebase-admin")


class FirebaseDataLoader:
    """Load data from Firebase Firestore"""
    
    def __init__(self):
        """Initialize Firestore connection"""
        self.db = None
        self._connect()
    
    def _connect(self) -> None:
        """Establish Firestore connection"""
        if not FIREBASE_AVAILABLE:
            raise ImportError("firebase-admin package required. Install with: pip install firebase-admin")
        
        try:
            # Check if Firebase is already initialized
            if not firebase_admin.get_app():
                # Initialize from environment or service account file
                credentials_path = os.getenv('FIREBASE_CREDENTIALS_PATH')
                
                if credentials_path and os.path.exists(credentials_path):
                    cred = credentials.Certificate(credentials_path)
                    firebase_admin.initialize_app(cred)
                    logger.info("✓ Firebase initialized from credentials file")
                else:
                    # Use Application Default Credentials
                    firebase_admin.initialize_app()
                    logger.info("✓ Firebase initialized with default credentials")
            
            self.db = firestore.client()
            
            # Test connection
            self.db.collection('buildings').limit(1).stream()
            logger.info("✓ Firestore connection successful")
        except Exception as e:
            logger.error(f"✗ Firestore connection failed: {e}")
            raise
    
    def load_issues_with_history(self, days_back: int = 365) -> pd.DataFrame:
        """
        Load issues from Firestore with complete history
        
        Args:
            days_back: Number of days of historical data to load
            
        Returns:
            DataFrame with issues and their history
        """
        cutoff_date = datetime.now() - timedelta(days=days_back)
        
        try:
            # Query issues
            issues_ref = self.db.collection('issues')
            query = issues_ref.where('created_at', '>=', cutoff_date)
            
            issues_data = []
            for doc in query.stream():
                issue = doc.to_dict()
                issue['id'] = doc.id
                
                # Load history for this issue
                history_ref = self.db.collection('issues').document(doc.id).collection('history')
                status_changes = 0
                for _ in history_ref.where('field_name', '==', 'status').stream():
                    status_changes += 1
                
                issue['status_changes'] = status_changes
                
                # Calculate resolution time
                if issue.get('resolved_at'):
                    resolution_hours = (issue['resolved_at'] - issue['created_at']).total_seconds() / 3600
                    issue['resolution_hours'] = resolution_hours
                    issue['resolution_days'] = resolution_hours / 24
                else:
                    issue['resolution_hours'] = None
                    issue['resolution_days'] = None
                
                issues_data.append(issue)
            
            df = pd.DataFrame(issues_data)
            logger.info(f"✓ Loaded {len(df)} issues from last {days_back} days")
            return df
            
        except Exception as e:
            logger.error(f"✗ Error loading issues: {e}")
            raise
    
    def load_building_data(self) -> pd.DataFrame:
        """Load building information from Firestore"""
        try:
            buildings_ref = self.db.collection('buildings')
            buildings_data = []
            
            for doc in buildings_ref.stream():
                building = doc.to_dict()
                building['id'] = doc.id
                
                # Get issue counts for this building
                issues_ref = self.db.collection('issues')
                
                # Total issues
                total_issues = len(list(issues_ref.where('building_id', '==', doc.id).limit(100).stream()))
                building['total_issues'] = total_issues
                
                # Issues by category
                for category in ['WATER', 'ELECTRICITY', 'WIFI', 'SANITATION', 'TEMPERATURE']:
                    count = len(list(
                        issues_ref
                        .where('building_id', '==', doc.id)
                        .where('category', '==', category)
                        .limit(100)
                        .stream()
                    ))
                    building[f'{category.lower()}_issues'] = count
                
                # Average severity
                severity_values = []
                for issue_doc in issues_ref.where('building_id', '==', doc.id).stream():
                    severity_values.append(issue_doc.get('severity', 0))
                
                building['avg_severity'] = np.mean(severity_values) if severity_values else 0
                
                # Last issue date
                recent_issues = list(
                    issues_ref
                    .where('building_id', '==', doc.id)
                    .order_by('created_at', direction=firestore.Query.DESCENDING)
                    .limit(1)
                    .stream()
                )
                building['last_issue_date'] = recent_issues[0].get('created_at') if recent_issues else None
                
                buildings_data.append(building)
            
            df = pd.DataFrame(buildings_data)
            logger.info(f"✓ Loaded {len(df)} buildings from Firestore")
            return df
            
        except Exception as e:
            logger.error(f"✗ Error loading buildings: {e}")
            raise
    
    def load_zone_risk_data(self) -> pd.DataFrame:
        """Load zone-level risk information from Firestore"""
        try:
            risk_ref = self.db.collection('risk_scores')
            risk_data = []
            
            for doc in risk_ref.stream():
                risk = doc.to_dict()
                risk['id'] = doc.id
                risk_data.append(risk)
            
            df = pd.DataFrame(risk_data)
            logger.info(f"✓ Loaded risk scores for {len(df)} zone-category combinations")
            return df
            
        except Exception as e:
            logger.error(f"✗ Error loading zone risk data: {e}")
            raise
    
    def load_recent_issues_by_building(self, building_id: str, days: int = 90) -> pd.DataFrame:
        """Load recent issues for a specific building"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        try:
            issues_ref = self.db.collection('issues')
            query = (issues_ref
                    .where('building_id', '==', building_id)
                    .where('created_at', '>=', cutoff_date)
                    .order_by('created_at', direction=firestore.Query.DESCENDING))
            
            issues_data = []
            for doc in query.stream():
                issue = doc.to_dict()
                issue['id'] = doc.id
                issues_data.append(issue)
            
            df = pd.DataFrame(issues_data)
            logger.info(f"✓ Loaded {len(df)} recent issues for building {building_id}")
            return df
            
        except Exception as e:
            logger.error(f"✗ Error loading building issues: {e}")
            raise
    
    def save_predictions(self, predictions: List[Dict[str, Any]]) -> None:
        """Save ML predictions back to Firestore"""
        try:
            predictions_ref = self.db.collection('ml_predictions')
            batch = self.db.batch()
            
            for pred in predictions:
                doc_ref = predictions_ref.document(pred['building_id'])
                batch.set(doc_ref, {
                    'building_id': pred['building_id'],
                    'failure_probability': pred['failure_probability'],
                    'risk_level': pred['failure_risk_level'],
                    'estimated_days_to_failure': pred['estimated_days_to_failure'],
                    'confidence': pred['confidence'],
                    'primary_concern': pred['primary_concern'],
                    'timestamp': datetime.now(),
                    'updated_at': datetime.now()
                })
            
            batch.commit()
            logger.info(f"✓ Saved {len(predictions)} predictions to Firestore")
        except Exception as e:
            logger.error(f"✗ Error saving predictions: {e}")
            raise
    
    def close(self) -> None:
        """Close Firestore connection"""
        if self.db:
            logger.info("✓ Firestore connection closed")


# Alias for compatibility
DataLoader = FirebaseDataLoader


class LocalDataLoader:
    """Fallback loader for local CSV data (for development/testing)"""
    
    @staticmethod
    def load_sample_data() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """Load sample data from CSV files"""
        # This creates sample data for testing without a database
        np.random.seed(42)
        
        # Generate sample issues - both historical and future
        n_issues = 1000  # Increased for better class distribution
        n_buildings = 20
        
        # Mix of historical dates (past year) and future dates (next month)
        # 80% historical, 20% future for realistic failure prediction
        historical_dates = pd.date_range(end=datetime.now() - timedelta(days=1), periods=800, freq='6H')
        future_dates = pd.date_range(start=datetime.now(), periods=200, freq='6H')
        all_dates = list(historical_dates) + list(future_dates)
        
        # Create issues with building distribution
        building_ids = []
        for building_id in range(n_buildings):
            # Each building gets ~50 issues
            building_ids.extend([f'building_{building_id}'] * 50)
        
        # Ensure we have exactly n_issues
        building_ids = building_ids[:n_issues]
        
        # Create severities with skew toward failures in future
        severities = []
        for i, date in enumerate(all_dates):
            if date >= datetime.now():  # Future issues
                # Higher severity for future issues (simulating predictions)
                severities.append(np.random.choice([1, 2, 3, 4, 5], p=[0.1, 0.1, 0.2, 0.3, 0.3]))
            else:  # Historical
                severities.append(np.random.randint(1, 6))
        
        issues_data = {
            'id': [f'issue_{i}' for i in range(n_issues)],
            'building_id': building_ids,
            'category': np.random.choice(['WATER', 'ELECTRICITY', 'WIFI', 'SANITATION', 'TEMPERATURE'], n_issues),
            'severity': severities,
            'status': np.random.choice(['OPEN', 'RESOLVED'], n_issues, p=[0.2, 0.8]),
            'created_at': all_dates,
            'resolved_at': [all_dates[i] + pd.to_timedelta(np.random.randint(1, 100), unit='H') for i in range(n_issues)],
            'status_changes': np.random.randint(0, 5, n_issues),
            'resolution_days': np.random.randint(1, 30, n_issues),
        }
        
        issues_df = pd.DataFrame(issues_data)
        
        # Generate sample buildings with some marked as failing
        buildings_list = []
        for i in range(n_buildings):
            building = {
                'id': f'building_{i}',
                'name': f'Building {chr(65+i)}',
                'building_type': np.random.choice(['Residential', 'Commercial', 'Academic']),
                'total_issues': np.random.randint(5, 50),
                'avg_severity': np.random.uniform(2, 4.5),
            }
            buildings_list.append(building)
        
        buildings_df = pd.DataFrame(buildings_list)
        
        # Generate sample risk scores
        risk_data = {
            'building_id': [f'building_{i}' for i in range(n_buildings)],
            'category': np.random.choice(['WATER', 'ELECTRICITY', 'WIFI', 'SANITATION', 'TEMPERATURE'], n_buildings),
            'risk_score': np.random.uniform(0, 10, n_buildings),
        }
        
        risk_df = pd.DataFrame(risk_data)
        
        logger.info(f"✓ Loaded sample data: {len(issues_df)} issues, {len(buildings_df)} buildings")
        logger.info(f"  - Historical issues: {len(issues_df[issues_df['created_at'] < datetime.now()])}")
        logger.info(f"  - Future issues: {len(issues_df[issues_df['created_at'] >= datetime.now()])}")
        
        return issues_df, buildings_df, risk_df
