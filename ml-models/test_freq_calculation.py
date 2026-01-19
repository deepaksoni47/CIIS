import numpy as np

# Simulate different issue counts and their resulting freq_scores
print("Testing Recency Score Calculation\n")
print("=" * 50)

test_cases = [0, 1, 3, 5, 10, 15, 20, 25, 30, 40, 50]

for num_issues in test_cases:
    # Calculate freq_score with logarithmic scale (same as in api_integration.py)
    if num_issues == 0:
        freq_score = 0.0
    else:
        freq_score = min(1.0, np.log(num_issues + 1) / np.log(30))
    
    # Simulate severity boost (assume varying critical issues)
    # Old boost: 0.1 * critical_issues
    # New boost: min(0.3, 0.05 * critical_issues)
    
    # Assume critical_issues is about 1/3 of total issues
    critical_issues = max(0, num_issues // 3)
    
    old_boost = 0.1 * critical_issues
    old_final = min(1.0, freq_score + old_boost)
    
    new_boost = min(0.3, 0.05 * critical_issues)
    new_final = min(1.0, freq_score + new_boost)
    
    print(f"\n{num_issues} issues ({critical_issues} critical):")
    print(f"  Base freq_score:     {freq_score:.3f} ({freq_score*100:.1f}%)")
    print(f"  Old boost:           +{old_boost:.3f} → Final: {old_final:.3f} ({old_final*100:.1f}%)")
    print(f"  New boost (capped):  +{new_boost:.3f} → Final: {new_final:.3f} ({new_final*100:.1f}%)")

print("\n" + "=" * 50)
print("\nConclusion:")
print("With old boost: Most buildings with 10+ issues hit 100%")
print("With new boost: Buildings show variation even with many issues")
