import requests

tests = [
    ("Normal user (active, 2 tasks)",
     dict(userId="u1", email="rahul@gmail.com", daysSinceLogin=0, weeklyLoginCount=10,
          tasksCompletedLast30Days=8, pendingTasks=0, avgSessionMinutes=60, activeTasks=2, criticalTasks=0)),
    ("Overloaded user (5 tasks, 2 CRITICAL)",
     dict(userId="u2", email="naresh@gmail.com", daysSinceLogin=0, weeklyLoginCount=10,
          tasksCompletedLast30Days=5, pendingTasks=0, avgSessionMinutes=60, activeTasks=5, criticalTasks=2)),
    ("Burned-out user (8 tasks, 3 CRITICAL)",
     dict(userId="u3", email="dev@company.com", daysSinceLogin=1, weeklyLoginCount=7,
          tasksCompletedLast30Days=3, pendingTasks=0, avgSessionMinutes=60, activeTasks=8, criticalTasks=3)),
    ("Inactive ghost (20 days no login)",
     dict(userId="u4", email="ghost@company.com", daysSinceLogin=20, weeklyLoginCount=0,
          tasksCompletedLast30Days=0, pendingTasks=0, avgSessionMinutes=2, activeTasks=0, criticalTasks=0)),
]

print("=" * 65)
print("BURNOUT + CHURN DETECTION — SCENARIO TEST")
print("=" * 65)

for name, payload in tests:
    r = requests.post("http://localhost:8000/churn_prediction", json=payload, timeout=5)
    d = r.json()
    churn = d.get("churnRisk", "?")
    burnout = d.get("burnoutRisk", "?")
    reason = d.get("primaryReason", "?")[:70]
    alert = d.get("alert", "")[:80]
    rec = d.get("recommendation", "")[:70]
    print(f"\nScenario: {name}")
    print(f"  Churn Risk:   {churn}")
    print(f"  Burnout Risk: {burnout}")
    print(f"  Signal:       {reason}")
    if alert:
        print(f"  Alert:        {alert}")
    print(f"  Action:       {rec}")

print("\n" + "=" * 65)
print("DONE")
print("=" * 65)
