"""推进项目阶段 — 跳过所有活动并推进到下一阶段"""
import urllib.request, json, sys

BASE = 'http://localhost:8000'

# 登录
req = urllib.request.Request(f'{BASE}/api/auth/login',
    data=json.dumps({'email': 'test2@test.com', 'password': 'Test123456'}).encode(),
    headers={'Content-Type': 'application/json'})
resp = json.loads(urllib.request.urlopen(req).read())
token = resp['data']['access_token']
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

# 跳过所有活动
activity_ids = ['act_e1974124131a', 'act_7a22a3e4fca7', 'act_be1f65c3cc24', 'act_18af01662b14']
for aid in activity_ids:
    req = urllib.request.Request(f'{BASE}/api/projects/proj_285ac0b183fd/activities/{aid}/action',
        data=json.dumps({'action': 'skip'}).encode(), headers=headers, method='POST')
    try:
        resp = urllib.request.urlopen(req)
        print(f'跳过 {aid} 成功')
    except urllib.error.HTTPError as e:
        print(f'跳过 {aid} 失败: {e.code}: {e.read().decode()[:200]}')

# 查看活动状态
req = urllib.request.Request(f'{BASE}/api/projects/proj_285ac0b183fd/activities', headers=headers)
resp = urllib.request.urlopen(req)
data = json.loads(resp.read())
for act in data['data']:
    print(f'  活动 {act["key"]}: {act["status"]}')

# 再次尝试推进阶段
req = urllib.request.Request(f'{BASE}/api/projects/proj_285ac0b183fd/advance',
    data=json.dumps({}).encode(), headers=headers, method='POST')
try:
    resp = urllib.request.urlopen(req)
    print('\n推进结果:', json.dumps(json.loads(resp.read()), ensure_ascii=False, indent=2)[:2000])
except urllib.error.HTTPError as e:
    print(f'\n推进失败: {e.code}: {e.read().decode()[:500]}')

# 查看审核项
req = urllib.request.Request(f'{BASE}/api/reviews?project_id=proj_285ac0b183fd', headers=headers)
try:
    resp = urllib.request.urlopen(req)
    print('\n审核项:', json.dumps(json.loads(resp.read()), ensure_ascii=False, indent=2)[:2000])
except urllib.error.HTTPError as e:
    print(f'\n获取审核项失败: {e.code}: {e.read().decode()[:300]}')

# 查看产出物
req = urllib.request.Request(f'{BASE}/api/artifacts?project_id=proj_285ac0b183fd', headers=headers)
try:
    resp = urllib.request.urlopen(req)
    print('\n产出物:', json.dumps(json.loads(resp.read()), ensure_ascii=False, indent=2)[:2000])
except urllib.error.HTTPError as e:
    print(f'\n获取产出物失败: {e.code}: {e.read().decode()[:300]}')