
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_endpoint(name, path, payload):
    print(f"Testing {name} ({path})...")
    try:
        res = requests.post(f"{BASE_URL}{path}", json=payload)
        if res.status_code == 200:
            print(f"  SUCCESS: {json.dumps(res.json(), indent=2)}")
            return res.json()
        else:
            print(f"  FAILED: Status {res.status_code}, {res.text}")
    except Exception as e:
        print(f"  ERROR: {str(e)}")
    return None

def main():
    print("--- STARTING COMPREHENSIVE AI TEST SUITE ---")
    
    # 1. Test Streaming Anomaly Detection (Live Trend)
    print("\n1. Testing Streaming Anomaly Detection (Live Trend)")
    for i in range(5):
        test_endpoint(f"Track Event {i+1}", "/track_activity", {"userId": "test-user", "action": "view", "duration": 1.5})
    
    # Simulate an anomaly
    test_endpoint("Anomaly Event", "/track_activity", {"userId": "test-user", "action": "EXTREME_BULK_DELETE_ALL", "duration": 500.0})

    # 2. Test Churn Prediction
    print("\n2. Testing Churn Prediction")
    test_endpoint("Churn High Risk", "/churn_prediction", {
        "userId": "u1", "email": "inactive@example.com",
        "daysSinceLogin": 20, "weeklyLoginCount": 0,
        "tasksCompletedLast30Days": 0, "pendingTasks": 5, "avgSessionMinutes": 2
    })

    # 3. Test Risk Prediction
    print("\n3. Testing Login Risk Prediction")
    test_endpoint("Risk High", "/login_anomaly", {
        "email": "risky@evil.com", "loginHour": 3, "dayOfWeek": 6,
        "failedAttempts": 5, "isNewDevice": True, "ipCountry": "KP"
    })

    # 4. Test Task Recommendation
    print("\n4. Testing Task Allocation (Recommendation)")
    test_endpoint("Allocate Task", "/allocate_task", {
        "description": "Critical security patch implementation",
        "users": [
            {"id": "u1", "email": "senior@dev.com", "role": "ADMIN"},
            {"id": "u2", "email": "junior@dev.com", "role": "USER"}
        ]
    })

    # 5. Test User Segmentation (Batch Analysis)
    print("\n5. Testing User Analysis (Segmentation/Risk)")
    test_endpoint("Analyze Users", "/analyze_users_batch", {
        "users": [
            {"id": "u1", "email": "power@user.com", "role": "USER"},
            {"id": "u2", "email": "new@hire.com", "role": "USER"}
        ]
    })

    print("\n--- TEST SUITE COMPLETE ---")

if __name__ == "__main__":
    main()
