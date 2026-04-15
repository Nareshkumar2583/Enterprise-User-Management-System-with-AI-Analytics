import requests
BASE_URL = 'http://localhost:8080'
res = requests.get(BASE_URL + '/api/sprints/active')
if res.status_code == 200:
    sprint = res.json()
    print('Active Sprint:', sprint['id'])
    stands = requests.get(f"{BASE_URL}/api/sprints/{sprint['id']}/standups")
    print('Standups length:', len(stands.json()), stands.status_code)
else:
    print('No active sprint found.')
