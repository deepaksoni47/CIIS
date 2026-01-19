"""
Risk Probability Model Training Script (Phase 3)
Trains comprehensive risk probability model using Phase 1 & 2 results
"""

import os
import sys
import logging
from datetime import datetime
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from data_loader import DataLoader, LocalDataLoader
from feature_engineering import FeatureEngineer
from anomaly_detection_model import AnomalyDetectionModel, AnomalyFeatureEngineer
from failure_prediction_model import FailurePredictionModel
from risk_probability_model import RiskProbabilityModel

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()


def train_risk_probability_model():
    """Main training pipeline for risk probability model"""
    
    try:
        logger.info("=" * 80)
        logger.info("RISK PROBABILITY MODEL TRAINING (PHASE 3)")
        logger.info("=" * 80)
        logger.info(f"Start Time: {datetime.now()}")
        logger.info("")
        
        # Create directories
        os.makedirs('models', exist_ok=True)
        os.makedirs('logs', exist_ok=True)
        
        # Step 1: Load data
        logger.info("[STEP 1] Loading data...")
        try:
            loader = DataLoader()
            issues_df = loader.load_issues_with_history()
            buildings_df = loader.load_building_data()
            logger.info(f"✓ Loaded from Firebase: {len(issues_df)} issues, {len(buildings_df)} buildings")
        except Exception as e:
            logger.warning(f"⚠ Firebase failed, using sample data: {e}")
            issues_df, buildings_df, _ = LocalDataLoader.load_sample_data()
            logger.info(f"✓ Loaded sample data: {len(issues_df)} issues, {len(buildings_df)} buildings")
        
        logger.info("")
        
        # Step 2: Get failure predictions
        logger.info("[STEP 2] Loading failure predictions...")
        try:
            failure_model = FailurePredictionModel()
            failure_model.load_model()
            
            engineer = FeatureEngineer()
            features_df, _ = engineer.create_training_dataset(issues_df, buildings_df)
            X, _ = failure_model.prepare_data(features_df)
            
            failure_predictions = failure_model.predict_time_window(X, issues_df, buildings_df)
            
            # Create mapping
            failure_map = {
                pred['building_id']: {
                    'failure_probability': pred['failure_probability'],
                    'estimated_days': pred.get('estimated_days_to_failure', 30)
                }
                for pred in failure_predictions
            }
            logger.info(f"✓ Loaded failure predictions for {len(failure_map)} buildings")
        except Exception as e:
            logger.warning(f"⚠ Failed to load failure predictions: {e}")
            failure_map = {}
        
        logger.info("")
        
        # Step 3: Get anomaly detection results
        logger.info("[STEP 3] Loading anomaly detection results...")
        try:
            anomaly_if = AnomalyDetectionModel(algorithm='isolation_forest')
            anomaly_if.load_model(
                model_path='models/anomaly_isolation_forest.pkl',
                scaler_path='models/anomaly_if_scaler.pkl'
            )
            
            anomaly_engineer = AnomalyFeatureEngineer()
            features_df = anomaly_engineer.engineer_anomaly_features(issues_df, buildings_df)
            
            numeric_features = features_df.select_dtypes(include=[np.number]).columns.tolist()
            numeric_features = [f for f in numeric_features if 'id' not in f and 'name' not in f]
            X = features_df[numeric_features].fillna(0).replace([np.inf, -np.inf], 0)
            
            _, _, anomaly_probs = anomaly_if.detect_anomalies(X)
            
            # Create mapping
            anomaly_map = {
                building_id: prob
                for building_id, prob in zip(features_df['id'], anomaly_probs)
            }
            logger.info(f"✓ Loaded anomaly detection for {len(anomaly_map)} buildings")
        except Exception as e:
            logger.warning(f"⚠ Failed to load anomaly detection: {e}")
            anomaly_map = {}
        
        logger.info("")
        
        # Step 4: Calculate issue frequency scores
        logger.info("[STEP 4] Calculating issue frequency scores...")
        frequency_scores = {}
        
        for building_id in buildings_df['id']:
            building_issues = issues_df[issues_df['building_id'] == building_id]
            
            # Count recent high-severity issues
            recent_critical = 0
            if len(building_issues) > 0:
                critical_issues = building_issues[building_issues['severity'] >= 4]
                recent_critical = len(critical_issues)
            
            # Calculate frequency score
            # Normalize: 20+ issues per building = 1.0
            freq_score = min(1.0, len(building_issues) / 20)
            
            frequency_scores[building_id] = {
                'frequency_score': freq_score,
                'recent_critical': recent_critical,
                'total_issues': len(building_issues)
            }
        
        logger.info(f"✓ Calculated frequency scores for {len(frequency_scores)} buildings")
        logger.info("")
        
        # Step 5: Initialize and compute risk model
        logger.info("[STEP 5] Computing comprehensive risk scores...")
        risk_model = RiskProbabilityModel(
            failure_weight=0.4,
            anomaly_weight=0.3,
            recency_weight=0.3
        )
        
        building_risks = []
        for building_id in buildings_df['id']:
            failure_prob = failure_map.get(building_id, {}).get('failure_probability', 0.0)
            anomaly_prob = anomaly_map.get(building_id, 0.0)
            freq_info = frequency_scores.get(building_id, {'frequency_score': 0.0, 'recent_critical': 0})
            
            risk_score = risk_model.calculate_building_risk(
                building_id=building_id,
                failure_probability=failure_prob,
                anomaly_probability=anomaly_prob,
                issue_frequency_score=freq_info['frequency_score'],
                recent_high_severity_issues=freq_info['recent_critical']
            )
            
            building_risks.append(risk_score)
        
        # Create results dataframe
        results_df = pd.DataFrame(building_risks)
        
        # Add building names
        name_map = dict(zip(buildings_df['id'], buildings_df.get('name', buildings_df['id'])))
        results_df['building_name'] = results_df['building_id'].map(name_map)
        
        # Reorder columns
        cols = ['building_id', 'building_name', 'risk_probability', 'risk_level', 
                'failure_component', 'anomaly_component', 'recency_component', 
                'recent_critical_issues', 'action']
        results_df = results_df[[c for c in cols if c in results_df.columns]]
        
        logger.info(f"✓ Computed risk scores for {len(results_df)} buildings")
        logger.info("")
        
        # Step 6: Calculate category risks
        logger.info("[STEP 6] Calculating category-specific risks...")
        category_risks = risk_model.calculate_category_risk(issues_df, buildings_df)
        logger.info(f"✓ Calculated category risks for {len(category_risks)} categories")
        logger.info("")
        
        # Step 7: Calculate zone risks
        logger.info("[STEP 7] Calculating zone-level risks...")
        zone_risks = risk_model.calculate_zone_risk(buildings_df, building_risks)
        logger.info(f"✓ Calculated zone risks for {len(zone_risks)} zones")
        logger.info("")
        
        # Step 8: Generate risk report
        logger.info("[STEP 8] Generating comprehensive risk report...")
        risk_report = risk_model.generate_risk_report(building_risks, category_risks, zone_risks)
        
        logger.info(f"✓ Risk Report Summary:")
        logger.info(f"  Total Buildings: {risk_report['summary']['total_buildings']}")
        logger.info(f"  Critical: {risk_report['summary']['critical_buildings']}")
        logger.info(f"  High Risk: {risk_report['risk_distribution']['HIGH']}")
        logger.info(f"  Average Risk: {risk_report['summary']['avg_risk_probability']:.2%}")
        logger.info("")
        
        # Step 9: Save models
        logger.info("[STEP 9] Saving models and results...")
        risk_model.save_model('models/risk_probability_model.pkl')
        
        results_df.to_csv('models/risk_probability_results.csv', index=False)
        category_risks.to_csv('models/category_risk_scores.csv', index=False)
        zone_risks.to_csv('models/zone_risk_scores.csv', index=False)
        
        # Save report as JSON
        import json
        with open('models/risk_assessment_report.json', 'w') as f:
            json.dump(risk_report, f, indent=2)
        
        logger.info(f"✓ Models and results saved")
        logger.info("")
        
        # Step 10: Generate visualizations
        logger.info("[STEP 10] Generating visualizations...")
        
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        
        # Risk distribution
        risk_counts = results_df['risk_level'].value_counts()
        colors = {'CRITICAL': 'red', 'HIGH': 'orange', 'MEDIUM': 'yellow', 'LOW': 'green'}
        risk_colors = [colors.get(level, 'gray') for level in risk_counts.index]
        
        axes[0, 0].bar(risk_counts.index, risk_counts.values, color=risk_colors)
        axes[0, 0].set_title('Risk Distribution Across Buildings', fontsize=12, fontweight='bold')
        axes[0, 0].set_ylabel('Number of Buildings')
        axes[0, 0].set_xlabel('Risk Level')
        
        # Risk probability distribution
        axes[0, 1].hist(results_df['risk_probability'], bins=20, color='steelblue', edgecolor='black')
        axes[0, 1].axvline(0.8, color='red', linestyle='--', label='Critical threshold')
        axes[0, 1].axvline(0.6, color='orange', linestyle='--', label='High threshold')
        axes[0, 1].set_title('Risk Probability Distribution', fontsize=12, fontweight='bold')
        axes[0, 1].set_xlabel('Risk Probability')
        axes[0, 1].set_ylabel('Frequency')
        axes[0, 1].legend()
        
        # Component contribution
        component_means = {
            'Failure': results_df['failure_component'].mean(),
            'Anomaly': results_df['anomaly_component'].mean(),
            'Recency': results_df['recency_component'].mean()
        }
        axes[1, 0].bar(component_means.keys(), component_means.values(), 
                      color=['#FF6B6B', '#4ECDC4', '#45B7D1'])
        axes[1, 0].set_title('Average Component Contribution to Risk', fontsize=12, fontweight='bold')
        axes[1, 0].set_ylabel('Average Score')
        axes[1, 0].set_ylim(0, 0.5)
        
        # Top 10 buildings
        top_10 = results_df.nlargest(10, 'risk_probability')
        colors_top = [colors.get(level, 'gray') for level in top_10['risk_level']]
        axes[1, 1].barh(range(len(top_10)), top_10['risk_probability'], color=colors_top)
        axes[1, 1].set_yticks(range(len(top_10)))
        axes[1, 1].set_yticklabels(top_10['building_name'])
        axes[1, 1].set_xlabel('Risk Probability')
        axes[1, 1].set_title('Top 10 High-Risk Buildings', fontsize=12, fontweight='bold')
        axes[1, 1].invert_yaxis()
        
        plt.tight_layout()
        plt.savefig('models/risk_probability_analysis.png', dpi=300, bbox_inches='tight')
        logger.info(f"✓ Saved visualization: models/risk_probability_analysis.png")
        plt.close()
        
        # Category risk visualization
        if len(category_risks) > 0:
            fig, ax = plt.subplots(figsize=(10, 6))
            
            category_risks_sorted = category_risks.sort_values('category_risk_score', ascending=False)
            ax.barh(category_risks_sorted['category'], category_risks_sorted['category_risk_score'],
                   color=['red' if x >= 0.6 else 'orange' if x >= 0.4 else 'green' 
                         for x in category_risks_sorted['category_risk_score']])
            ax.set_xlabel('Category Risk Score')
            ax.set_title('Infrastructure Category Risk Assessment', fontsize=12, fontweight='bold')
            
            plt.tight_layout()
            plt.savefig('models/category_risk_analysis.png', dpi=300, bbox_inches='tight')
            logger.info(f"✓ Saved visualization: models/category_risk_analysis.png")
            plt.close()
        
        logger.info("")
        logger.info("=" * 80)
        logger.info("TRAINING COMPLETE ✅")
        logger.info("=" * 80)
        logger.info(f"End Time: {datetime.now()}")
        logger.info("")
        logger.info("📊 Output files:")
        logger.info("  ✓ models/risk_probability_model.pkl")
        logger.info("  ✓ models/risk_probability_results.csv")
        logger.info("  ✓ models/category_risk_scores.csv")
        logger.info("  ✓ models/zone_risk_scores.csv")
        logger.info("  ✓ models/risk_assessment_report.json")
        logger.info("  ✓ models/risk_probability_analysis.png")
        logger.info("  ✓ models/category_risk_analysis.png")
        logger.info("")
        logger.info("📈 Key Metrics:")
        logger.info(f"  - Critical Risk Buildings: {risk_report['summary']['critical_buildings']}")
        logger.info(f"  - High Risk Buildings: {risk_report['risk_distribution']['HIGH']}")
        logger.info(f"  - Average Risk Score: {risk_report['summary']['avg_risk_probability']:.2%}")
        logger.info("")
        logger.info("🚀 Next steps:")
        logger.info("  1. Review results in models/risk_probability_results.csv")
        logger.info("  2. Check detailed report in models/risk_assessment_report.json")
        logger.info("  3. Integrate with API using api_integration.py")
        logger.info("  4. Use in maintenance scheduling and resource allocation")
        
        return results_df, category_risks, zone_risks, risk_report
        
    except Exception as e:
        logger.error(f"✗ Error during training: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    results_df, category_risks, zone_risks, risk_report = train_risk_probability_model()
