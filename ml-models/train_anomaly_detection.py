"""
Anomaly Detection Model Training Script
Trains multiple anomaly detection models for building issue patterns
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

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from data_loader import DataLoader, LocalDataLoader
from anomaly_detection_model import AnomalyDetectionModel, AnomalyFeatureEngineer

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()


def train_anomaly_detection_model():
    """Main training pipeline for anomaly detection"""
    
    try:
        logger.info("=" * 80)
        logger.info("ANOMALY DETECTION MODEL TRAINING")
        logger.info("=" * 80)
        logger.info(f"Start Time: {datetime.now()}")
        logger.info("")
        
        # Create models directory
        os.makedirs('models', exist_ok=True)
        os.makedirs('logs', exist_ok=True)
        
        # Step 1: Load data
        logger.info("[STEP 1] Loading data...")
        try:
            loader = DataLoader()
            issues_df = loader.load_issues_with_history()
            buildings_df = loader.load_building_data()
            logger.info(f"✓ Loaded {len(issues_df)} issues and {len(buildings_df)} buildings from Firebase")
        except Exception as e:
            logger.warning(f"⚠ Firebase connection failed, using sample data: {e}")
            issues_df, buildings_df, _ = LocalDataLoader.load_sample_data()
            logger.info(f"✓ Loaded {len(issues_df)} issues and {len(buildings_df)} buildings from sample data")
        
        logger.info("")
        
        # Step 2: Engineer anomaly detection features
        logger.info("[STEP 2] Engineering anomaly detection features...")
        engineer = AnomalyFeatureEngineer()
        features_df = engineer.engineer_anomaly_features(issues_df, buildings_df)
        
        # Select numeric features only
        numeric_features = features_df.select_dtypes(include=[np.number]).columns.tolist()
        numeric_features = [f for f in numeric_features if 'id' not in f and 'name' not in f]
        X = features_df[numeric_features].fillna(0).replace([np.inf, -np.inf], 0)
        
        logger.info(f"✓ Engineered {len(numeric_features)} features for {len(X)} buildings")
        logger.info(f"  Features: {', '.join(numeric_features[:5])}...")
        logger.info("")
        
        # Step 3: Train Isolation Forest
        logger.info("[STEP 3] Training Isolation Forest model...")
        if_model = AnomalyDetectionModel(algorithm='isolation_forest', contamination=0.15)
        if_metrics = if_model.train(X)
        logger.info(f"✓ Isolation Forest trained")
        logger.info("")
        
        # Step 4: Train One-Class SVM
        logger.info("[STEP 4] Training One-Class SVM model...")
        svm_model = AnomalyDetectionModel(algorithm='one_class_svm', contamination=0.15)
        svm_metrics = svm_model.train(X)
        logger.info(f"✓ One-Class SVM trained")
        logger.info("")
        
        # Step 5: Detect anomalies
        logger.info("[STEP 5] Detecting anomalies...")
        if_preds, if_scores, if_probs = if_model.detect_anomalies(X)
        svm_preds, svm_scores, svm_probs = svm_model.detect_anomalies(X)
        
        # Combine predictions (ensemble)
        ensemble_anomaly_prob = (if_probs + svm_probs) / 2
        
        # Create results dataframe
        results_df = pd.DataFrame({
            'building_id': features_df['id'],
            'building_name': features_df.get('name', features_df['id']),
            'if_anomaly_probability': if_probs,
            'svm_anomaly_probability': svm_probs,
            'ensemble_anomaly_probability': ensemble_anomaly_prob,
            'if_anomaly': (if_preds == -1).astype(int),
            'svm_anomaly': (svm_preds == -1).astype(int),
            'ensemble_anomaly_flag': (ensemble_anomaly_prob > 0.5).astype(int),
        })
        
        # Add anomaly severity
        def get_severity(prob):
            if prob >= 0.8:
                return 'CRITICAL'
            elif prob >= 0.6:
                return 'HIGH'
            elif prob >= 0.4:
                return 'MEDIUM'
            else:
                return 'LOW'
        
        results_df['anomaly_severity'] = results_df['ensemble_anomaly_probability'].apply(get_severity)
        
        # Sort by anomaly probability
        results_df = results_df.sort_values('ensemble_anomaly_probability', ascending=False)
        
        logger.info(f"✓ Anomalies detected:")
        critical = (results_df['ensemble_anomaly_probability'] >= 0.8).sum()
        high = ((results_df['ensemble_anomaly_probability'] >= 0.6) & (results_df['ensemble_anomaly_probability'] < 0.8)).sum()
        medium = ((results_df['ensemble_anomaly_probability'] >= 0.4) & (results_df['ensemble_anomaly_probability'] < 0.6)).sum()
        
        logger.info(f"  CRITICAL: {critical} buildings")
        logger.info(f"  HIGH: {high} buildings")
        logger.info(f"  MEDIUM: {medium} buildings")
        logger.info("")
        
        # Step 6: Detect spike anomalies
        logger.info("[STEP 6] Detecting spike anomalies...")
        spike_anomalies = if_model.detect_spike_anomalies(issues_df, features_df, window_days=7)
        logger.info(f"✓ Found {len(spike_anomalies)} spike anomalies")
        logger.info("")
        
        # Step 7: Detect temporal anomalies
        logger.info("[STEP 7] Detecting temporal anomalies...")
        temporal_anomalies = if_model.detect_temporal_anomalies(issues_df, features_df)
        logger.info(f"✓ Found {len(temporal_anomalies)} temporal anomalies")
        logger.info("")
        
        # Step 8: Save models
        logger.info("[STEP 8] Saving models...")
        if_model.save_model(
            model_path='models/anomaly_isolation_forest.pkl',
            scaler_path='models/anomaly_if_scaler.pkl'
        )
        svm_model.save_model(
            model_path='models/anomaly_one_class_svm.pkl',
            scaler_path='models/anomaly_svm_scaler.pkl'
        )
        logger.info(f"✓ Models saved")
        logger.info("")
        
        # Step 9: Save results
        logger.info("[STEP 9] Saving results...")
        results_df.to_csv('models/anomaly_detection_results.csv', index=False)
        
        # Save spike anomalies
        if spike_anomalies:
            spikes_df = pd.DataFrame(spike_anomalies)
            spikes_df.to_csv('models/spike_anomalies.csv', index=False)
        
        # Save temporal anomalies
        if temporal_anomalies:
            temporal_df = pd.DataFrame(temporal_anomalies)
            temporal_df.to_csv('models/temporal_anomalies.csv', index=False)
        
        logger.info(f"✓ Results saved to models/")
        logger.info("")
        
        # Step 10: Generate visualizations
        logger.info("[STEP 10] Generating visualizations...")
        
        # Plot 1: Anomaly score distribution
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        
        # Isolation Forest scores
        axes[0, 0].hist(if_scores, bins=30, alpha=0.7, color='blue', edgecolor='black')
        axes[0, 0].axvline(np.percentile(if_scores, 15), color='red', linestyle='--', label='15th percentile')
        axes[0, 0].set_title('Isolation Forest Anomaly Scores')
        axes[0, 0].set_xlabel('Anomaly Score')
        axes[0, 0].set_ylabel('Frequency')
        axes[0, 0].legend()
        
        # SVM scores
        axes[0, 1].hist(svm_scores, bins=30, alpha=0.7, color='green', edgecolor='black')
        axes[0, 1].axvline(np.percentile(svm_scores, 15), color='red', linestyle='--', label='15th percentile')
        axes[0, 1].set_title('One-Class SVM Anomaly Scores')
        axes[0, 1].set_xlabel('Anomaly Score')
        axes[0, 1].set_ylabel('Frequency')
        axes[0, 1].legend()
        
        # Ensemble probability
        axes[1, 0].hist(ensemble_anomaly_prob, bins=30, alpha=0.7, color='purple', edgecolor='black')
        axes[1, 0].axvline(0.5, color='red', linestyle='--', label='Decision threshold')
        axes[1, 0].set_title('Ensemble Anomaly Probability')
        axes[1, 0].set_xlabel('Probability')
        axes[1, 0].set_ylabel('Frequency')
        axes[1, 0].legend()
        
        # Model agreement
        agreement = ((if_preds == -1) & (svm_preds == -1)).sum()
        disagreement = ((if_preds == -1) != (svm_preds == -1)).sum()
        normal = ((if_preds == 1) & (svm_preds == 1)).sum()
        
        axes[1, 1].pie(
            [agreement, disagreement, normal],
            labels=[f'Both Detect\nAnomalies\n({agreement})', 
                   f'Disagreement\n({disagreement})', 
                   f'Both Normal\n({normal})'],
            autopct='%1.1f%%',
            colors=['red', 'orange', 'green']
        )
        axes[1, 1].set_title('Model Agreement')
        
        plt.tight_layout()
        plt.savefig('models/anomaly_detection_analysis.png', dpi=300, bbox_inches='tight')
        logger.info(f"✓ Saved visualization: models/anomaly_detection_analysis.png")
        plt.close()
        
        # Plot 2: Top anomalies
        fig, ax = plt.subplots(figsize=(12, 8))
        top_n = 15
        top_anomalies = results_df.head(top_n)
        
        colors = ['red' if severity == 'CRITICAL' else 'orange' if severity == 'HIGH' else 'yellow' 
                 for severity in top_anomalies['anomaly_severity']]
        
        ax.barh(range(len(top_anomalies)), top_anomalies['ensemble_anomaly_probability'], color=colors)
        ax.set_yticks(range(len(top_anomalies)))
        ax.set_yticklabels(top_anomalies['building_name'])
        ax.set_xlabel('Anomaly Probability')
        ax.set_title(f'Top {top_n} Buildings with Highest Anomaly Probability')
        ax.axvline(0.5, color='black', linestyle='--', alpha=0.5, label='Decision threshold')
        ax.legend()
        plt.tight_layout()
        plt.savefig('models/top_anomalies.png', dpi=300, bbox_inches='tight')
        logger.info(f"✓ Saved visualization: models/top_anomalies.png")
        plt.close()
        
        logger.info("")
        logger.info("=" * 80)
        logger.info("TRAINING COMPLETE ✅")
        logger.info("=" * 80)
        logger.info(f"End Time: {datetime.now()}")
        logger.info("")
        logger.info("📊 Output files:")
        logger.info("  ✓ models/anomaly_isolation_forest.pkl")
        logger.info("  ✓ models/anomaly_one_class_svm.pkl")
        logger.info("  ✓ models/anomaly_detection_results.csv")
        logger.info("  ✓ models/spike_anomalies.csv")
        logger.info("  ✓ models/temporal_anomalies.csv")
        logger.info("  ✓ models/anomaly_detection_analysis.png")
        logger.info("  ✓ models/top_anomalies.png")
        logger.info("")
        logger.info("🚀 Next steps:")
        logger.info("  1. Review results in models/anomaly_detection_results.csv")
        logger.info("  2. Check anomalies at: models/spike_anomalies.csv")
        logger.info("  3. Integrate with API using api_integration.py")
        logger.info("  4. Monitor for false positives and adjust contamination parameter")
        
        return results_df, spike_anomalies, temporal_anomalies
        
    except Exception as e:
        logger.error(f"✗ Error during training: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    results_df, spike_anomalies, temporal_anomalies = train_anomaly_detection_model()
