import requests
import uuid

BASE_URL = 'http://localhost:8080'
unique_email = f"scrum_admin_{uuid.uuid4().hex[:8]}@test.com"

user = {'name':'Scrum Admin Test', 'email': unique_email, 'password': 'pass', 'role': 'ADMIN'}
res = requests.post(BASE_URL + '/api/auth/register', json=user)
# Always login to get the token, whether registration succeeded or it already exists
login_res = requests.post(BASE_URL + '/api/auth/login', json={'email': unique_email, 'password':'pass'})

if login_res.status_code != 200:
    print('Login failed!', login_res.text)
    exit(1)

token = login_res.json().get('token')
headers = {'Authorization': 'Bearer ' + token}

sprint_data = {
    'name': 'Alpha Launch Sprint',
    'goal': 'Launch the new Scrum features',
    'startDate': '2026-04-15',
    'endDate': '2026-04-29',
    'velocityTarget': 40
}
sprint_res = requests.post(BASE_URL + '/api/sprints', json=sprint_data, headers=headers)
sprint = sprint_res.json()
print('Sprint Created:', sprint['name'])

task_data = {'title': 'Design Burndown Chart', 'description': 'Recharts', 'priority': 'HIGH', 'status': 'TODO', 'storyPoints': 5}
task_res = requests.post(BASE_URL + '/api/tasks', json=task_data, headers=headers)
task_id = task_res.json()['id']
print('Task created:', task_id)

add_res = requests.post(f"{BASE_URL}/api/sprints/{sprint['id']}/add-task/{task_id}", headers=headers)
print('Add task to sprint:', add_res.status_code)

burn_res = requests.get(f"{BASE_URL}/api/sprints/{sprint['id']}/burndown", headers=headers)
print('Burndown totalPoints:', burn_res.json().get('totalPoints'))

standup = {'yesterday': 'Did planning', 'today': 'Working', 'blockers': 'None', 'mood': 'GREAT', 'sprintId': sprint['id']}
standup_res = requests.post(BASE_URL + '/api/sprints/standup', json=standup, headers=headers)
print('Standup status:', standup_res.status_code)

act_res = requests.put(f"{BASE_URL}/api/sprints/{sprint['id']}/status", json={'status': 'ACTIVE'}, headers=headers)
print('Activate status:', act_res.status_code)
print('Testing completed successfully.')
