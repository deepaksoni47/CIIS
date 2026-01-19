from data_loader import LocalDataLoader

# Load the actual data
issues_df, buildings_df, _ = LocalDataLoader.load_sample_data()

print("Building Issue Counts:\n")
print("=" * 60)

for building_id in buildings_df['id']:
    building_issues = issues_df[issues_df['building_id'] == building_id]
    num_issues = len(building_issues)
    critical_issues = len(building_issues[building_issues['severity'] >= 4])
    
    print(f"{building_id:15s}: {num_issues:3d} issues ({critical_issues:2d} critical)")

print("\n" + "=" * 60)
total_issues = len(issues_df)
avg_issues = total_issues / len(buildings_df)
print(f"\nTotal issues: {total_issues}")
print(f"Average per building: {avg_issues:.1f}")
print(f"Min issues: {issues_df.groupby('building_id').size().min()}")
print(f"Max issues: {issues_df.groupby('building_id').size().max()}")
