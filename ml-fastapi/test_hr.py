
import requests
import os
os.environ["PYTHONIOENCODING"] = "utf-8"

BASE = "http://localhost:8000"

def post(path, body):
    try:
        r = requests.post(f"{BASE}{path}", json=body, timeout=5)
        if r.status_code == 200:
            print(f"  PASS [{r.status_code}] {path}")
            data = r.json()
            for key in ["churnRisk", "churnScore", "alert", "primaryReason", "recommendation"]:
                if key in data:
                    print(f"     {key}: {str(data[key])[:80]}")
            return True
        else:
            print(f"  FAIL [{r.status_code}] {path}: {r.text[:200]}")
            return False
    except Exception as e:
        print(f"  ERROR on {path}: {e}")
        return False

print("=" * 65)
print("HR INTELLIGENCE HUB — ENDPOINT TEST SUITE")
print("=" * 65)

# Test 3 different churn scenarios
test_cases = [
    {
        "name": "Active Healthy User",
        "payload": {
            "userId": "u1", "email": "rahul@gmail.com",
            "daysSinceLogin": 1, "weeklyLoginCount": 15,
            "tasksCompletedLast30Days": 20, "pendingTasks": 2, "avgSessionMinutes": 60
        }
    },
    {
        "name": "At-Risk User (3 days inactive)",
        "payload": {
            "userId": "u2", "email": "naresh@gmail.com",
            "daysSinceLogin": 3, "weeklyLoginCount": 4,
            "tasksCompletedLast30Days": 8, "pendingTasks": 2, "avgSessionMinutes": 45
        }
    },
    {
        "name": "Critical Churn Risk (20 days inactive)",
        "payload": {
            "userId": "u3", "email": "inactive@company.com",
            "daysSinceLogin": 20, "weeklyLoginCount": 0,
            "tasksCompletedLast30Days": 0, "pendingTasks": 5, "avgSessionMinutes": 2
        }
    }
]

all_passed = True
for case in test_cases:
    print(f"\n  Testing: {case['name']}")
    ok = post("/churn_prediction", case["payload"])
    if not ok:
        all_passed = False

print("\n" + "=" * 65)
print(f"RESULT: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
print("=" * 65)
