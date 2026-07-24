"""检查项目状态"""
import urllib.request, json

BASE = 'http://localhost:8000'

req = urllib.request.Request(f'{BASE}/api/auth/login',
    data=json.dumps({'email': 'test2@test.com', 'password': 'Test123456'}).encode(),
    headers={'Content-Type': 'application/json'})
resp = json.loads(urllib.request.urlopen(req).read())
token = resp['data']['access_token']
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

# 获取当前活动
req = urllib.request.Request(f'{BASE}/api/projects/proj_285ac0b183fd/activities', headers=headers)
resp = urllib.request.urlopen(req)
data = json.loads(resp.read())
print('当前活动:')
for act in data['data']:
    print(f'  ID: {act["id"]}, key: {act["key"]}, status: {act["status"]}')

# 获取门禁状态
req = urllib.request.Request(f'{BASE}/api/projects/proj_285ac0b183fd/gates', headers=headers)
resp = urllib.request.urlopen(req)
data = json.loads(resp.read())
print('\n门禁状态:')
for g in data['data']:
    print(f'  {g}: {json.dumps(g, ensure_ascii=False)[:200]}')