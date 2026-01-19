import numpy as np

print("Testing New Square Root Formula\n")
print("=" * 70)

# Simulate the actual building data (all have 50 issues, varying critical)
buildings = [
    ("building_0", 50, 23),
    ("building_1", 50, 22),
    ("building_5", 50, 21),
    ("building_13", 50, 17),
    ("building_3", 50, 15),
    ("building_17", 50, 28),
    ("building_18", 50, 30),
    ("building_19", 50, 34),
]

max_expected_issues = 100

for name, num_issues, critical_issues in buildings:
    # Square root scale
    freq_score = min(1.0, np.sqrt(num_issues) / np.sqrt(max_expected_issues))
    
    # Critical ratio boost (up to 20% for high critical ratios)
    critical_ratio = critical_issues / num_issues
    critical_boost = min(0.2, critical_ratio * 0.4)
    final_score = min(1.0, freq_score + critical_boost)
    
    print(f"\n{name}:")
    print(f"  Issues: {num_issues}, Critical: {critical_issues} ({critical_ratio*100:.0f}%)")
    print(f"  Base (sqrt):       {freq_score:.3f} ({freq_score*100:.1f}%)")
    print(f"  + Critical ratio:  {critical_boost:.3f} → {final_score:.3f} ({final_score*100:.1f}%)")

print("\n" + "=" * 70)
print("\nExpected variation: Buildings with fewer critical issues → ~83-88%")
print("                    Buildings with more critical issues → ~89-91%")
