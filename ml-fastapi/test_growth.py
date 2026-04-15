
import requests
import json

BASE = "http://localhost:8000"

def post(path, body):
    try:
        r = requests.post(f"{BASE}{path}", json=body, timeout=5)
        print(f"  [{r.status_code}] {path}")
        if r.status_code == 200:
            data = r.json()
            print(f"  RESPONSE: {json.dumps(data, indent=2)[:400]}")
        else:
            print(f"  ERROR: {r.text[:300]}")
        return r.status_code == 200
    except Exception as e:
        print(f"  EXCEPTION on {path}: {e}")
        return False

payload_base = {
    "userId": "test-user-123",
    "email": "naresh@gmail.com",
    "tasks": [
        {"id": "t1", "title": "Fix API bug", "status": "IN_PROGRESS", "priority": "CRITICAL",
         "delayRisk": "HIGH RISK", "estimatedHours": 3, "assigneeId": "test-user-123"},
        {"id": "t2", "title": "Build React component", "status": "TODO", "priority": "NORMAL",
         "delayRisk": "LOW RISK", "estimatedHours": 2, "assigneeId": "test-user-123"},
        {"id": "t3", "title": "Write tests", "status": "DONE", "priority": "NORMAL",
         "delayRisk": "LOW RISK", "estimatedHours": 1, "assigneeId": "test-user-123"}
    ]
}

print("=" * 60)
print("GROWTH INSIGHTS PAGE - ENDPOINT TESTS")
print("=" * 60)

print("\n1. Testing /growth_insights ...")
ok1 = post("/growth_insights", {**payload_base, "skills": ["Java", "React", "Python"]})

print("\n2. Testing /workload_prediction ...")
ok2 = post("/workload_prediction", payload_base)

print("\n3. Testing /collaboration_suggestions ...")
ok3 = post("/collaboration_suggestions", {
    **payload_base,
    "userSkills": ["Java", "React"],
    "allUsers": [
        {"id": "u2", "email": "rahul@gmail.com", "skills": ["Java", "Spring"]},
        {"id": "u3", "email": "admin@enterprise.com", "skills": ["Python", "ML"]}
    ]
})

print("\n" + "=" * 60)
print(f"RESULTS: growth={'OK' if ok1 else 'FAIL'}, workload={'OK' if ok2 else 'FAIL'}, collab={'OK' if ok3 else 'FAIL'}")
print("=" * 60)
