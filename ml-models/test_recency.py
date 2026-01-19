import requests

r = requests.get('http://127.0.0.1:5000/api/ml/risk')
data = r.json()
scores = data.get('risk_scores', [])

print('Total buildings:', len(scores))
print('\nFirst 5 buildings:')
for i, s in enumerate(scores[:5]):
    print(f"Building {i+1}: {s['building_id']}")
    print(f"  Recency: {s['recency_component']*100:.1f}%")
    print(f"  Failure: {s['failure_component']*100:.1f}%")
    print(f"  Anomaly: {s['anomaly_component']*100:.1f}%")
    print()

recency_values = [s['recency_component'] for s in scores]
print(f'Unique recency values: {len(set(recency_values))}')
print(f'Recency range: {min(recency_values):.3f} - {max(recency_values):.3f}')
print(f'All recency values: {sorted(set(recency_values))}')
