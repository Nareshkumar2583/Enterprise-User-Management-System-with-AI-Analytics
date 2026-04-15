import requests, uuid

BASE_URL = 'http://localhost:8080'
unique_email = f"scrum_admin_{uuid.uuid4().hex[:8]}@test.com"
user = {'name':'Scrum Admin Test', 'email': unique_email, 'password': 'pass', 'role': 'ADMIN'}

print('Registering...')
res = requests.post(BASE_URL + '/api/auth/register', json=user)
print('Register status:', res.status_code, res.text)
