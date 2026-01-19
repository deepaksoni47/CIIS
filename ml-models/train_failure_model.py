"""
Main training script for failure prediction model
"""

import logging
import sys
from datetime import datetime

import pandas as pd
from sklearn.model_selection import train_test_split

from data_loader import DataLoader, LocalDataLoader
from feature_engineering import FeatureEngineer
from failure_prediction_model import FailurePredictionModel

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def train_failure_prediction_model(use_local_data: bool = True):
    """
    Train failure prediction model
    
    Args:
        use_local_data: If True, use sample data. If False, connect to PostgreSQL
    """
    
    logger.info("=" * 80)
    logger.info("FAILURE PREDICTION MODEL TRAINING")
    logger.info("=" * 80)
    logger.info(f"Start Time: {datetime.now()}")
    
    try:
        # ==================== STEP 1: Load Data ====================
        logger.info("\n[STEP 1] Loading data...")
        
        if use_local_data:
            issues_df, buildings_df, risk_df = LocalDataLoader.load_sample_data()
        else:
            loader = DataLoader()
            issues_df = loader.load_issues_with_history(days_back=365)
            buildings_df = loader.load_building_data()
            loader.close()
        
        logger.info(f"✓ Loaded {len(issues_df)} issues and {len(buildings_df)} buildings")
        
        # ==================== STEP 2: Feature Engineering ====================
        logger.info("\n[STEP 2] Engineering features...")
        
        engineer = FeatureEngineer()
        features_df, targets = engineer.create_training_dataset(
            issues_df, 
            buildings_df,
            target_window_days=30
        )
        
        # ==================== STEP 3: Prepare Data ====================
        logger.info("\n[STEP 3] Preparing training data...")
        
        model = FailurePredictionModel(model_type='xgboost')
        X, y = model.prepare_data(features_df)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        X_train, X_val, y_train, y_val = train_test_split(
            X_train, y_train, test_size=0.2, random_state=42, stratify=y_train
        )
        
        logger.info(f"✓ Split data:")
        logger.info(f"  - Train: {len(X_train)} samples")
        logger.info(f"  - Val: {len(X_val)} samples")
        logger.info(f"  - Test: {len(X_test)} samples")
        
        # ==================== STEP 4: Train Model ====================
        logger.info("\n[STEP 4] Training model...")
        
        metrics = model.train(X_train, y_train, X_val, y_val)
        
        # ==================== STEP 5: Evaluate ====================
        logger.info("\n[STEP 5] Evaluating model...")
        
        X_test_scaled = model.scaler.transform(X_test)
        y_pred = model.classifier.predict(X_test_scaled)
        y_pred_proba = model.classifier.predict_proba(X_test_scaled)[:, 1]
        
        from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
        
        logger.info("\nTest Set Performance:")
        logger.info(f"AUC-ROC: {roc_auc_score(y_test, y_pred_proba):.4f}")
        logger.info("\nClassification Report:")
        logger.info(classification_report(y_test, y_pred, 
                                         target_names=['No Failure', 'Failure']))
        
        # ==================== STEP 6: Feature Importance ====================
        logger.info("\n[STEP 6] Analyzing feature importance...")
        
        importance_df = model.get_feature_importance()
        logger.info("\nTop 10 Important Features:")
        logger.info(importance_df.head(10).to_string(index=False))
        
        # ==================== STEP 7: Visualizations ====================
        logger.info("\n[STEP 7] Creating visualizations...")
        
        model.plot_feature_importance(top_n=15)
        model.plot_roc_curve(y_test, y_pred_proba)
        
        # ==================== STEP 8: Make Predictions ====================
        logger.info("\n[STEP 8] Making predictions on all buildings...")
        
        predictions = model.predict_time_window(X, issues_df, buildings_df)
        
        # Display top at-risk buildings
        predictions_sorted = sorted(predictions, 
                                   key=lambda x: x['failure_probability'], 
                                   reverse=True)
        
        logger.info("\nTop 10 Buildings at Risk of Failure:")
        logger.info("-" * 100)
        logger.info(f"{'Building':<25} {'Failure Prob':<15} {'Days to Fail':<15} {'Risk Level':<12} {'Concern':<20}")
        logger.info("-" * 100)
        
        for pred in predictions_sorted[:10]:
            logger.info(
                f"{pred['building_name']:<25} {pred['failure_probability']:<15.2%} "
                f"{pred['estimated_days_to_failure']:<15} {pred['failure_risk_level']:<12} "
                f"{pred['primary_concern']:<20}"
            )
        
        # ==================== STEP 9: Save Model ====================
        logger.info("\n[STEP 9] Saving model...")
        
        model.save_model()
        
        # Save predictions to CSV
        predictions_df = pd.DataFrame(predictions)
        predictions_df.to_csv('models/failure_predictions.csv', index=False)
        logger.info("✓ Saved predictions to models/failure_predictions.csv")
        
        logger.info("\n" + "=" * 80)
        logger.info("✓ TRAINING COMPLETED SUCCESSFULLY")
        logger.info("=" * 80)
        logger.info(f"End Time: {datetime.now()}")
        
        return model, predictions_df
        
    except Exception as e:
        logger.error(f"✗ Error during training: {e}", exc_info=True)
        sys.exit(1)


def demonstrate_predictions(model, buildings_df, issues_df):
    """
    Demonstrate how to use the model for predictions
    """
    
    logger.info("\n" + "=" * 80)
    logger.info("DEMONSTRATION: Making Predictions for New Data")
    logger.info("=" * 80)
    
    # Example: Get predictions for a specific building
    if len(buildings_df) > 0:
        example_building = buildings_df.iloc[0]
        logger.info(f"\nExample Building: {example_building['name']}")
        
        building_issues = issues_df[issues_df['building_id'] == example_building['id']]
        logger.info(f"Historical Issues: {len(building_issues)}")
        
        if len(building_issues) > 0:
            logger.info(f"Categories: {building_issues['category'].value_counts().to_dict()}")
            logger.info(f"Avg Severity: {building_issues['severity'].mean():.2f}")


if __name__ == "__main__":
    # Train with sample data (set use_local_data=False to use PostgreSQL)
    model, predictions_df = train_failure_prediction_model(use_local_data=True)
    
    logger.info("\n✓ Model training complete!")
    logger.info("✓ Next steps:")
    logger.info("  1. Deploy model as API endpoint")
    logger.info("  2. Setup periodic retraining (weekly/monthly)")
    logger.info("  3. Integrate with notification system")
    logger.info("  4. Build visualization dashboard")
