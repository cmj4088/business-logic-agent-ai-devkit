"""验证 API 端点是否正常工作"""
import urllib.request, json

BASE = 'http://localhost:8000'

req = urllib.request.Request(f'{BASE}/api/auth/login',
    data=json.dumps({'email': 'test2@test.com', 'password': 'Test123456'}).encode(),
    headers={'Content-Type': 'application/json'})
resp = json.loads(urllib.request.urlopen(req).read())
token = resp['data']['access_token']
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

print('=== 审核列表 ===')
req = urllib.request.Request(f'{BASE}/api/reviews', headers=headers)
resp = json.loads(urllib.request.urlopen(req).read())
print(f'状态: {resp.get("error")}')
print(f'审核项数量: {len(resp["data"].get("items", []))}')
for item in resp['data'].get('items', []):
    print(f'  - {item["id"]}: {item["status"]} (assigned_to: {item.get("assigned_to","")})')

print('\n=== 产出物列表 ===')
req = urllib.request.Request(f'{BASE}/api/artifacts?project_id=proj_285ac0b183fd', headers=headers)
resp = json.loads(urllib.request.urlopen(req).read())
print(f'状态: {resp.get("error")}')
print(f'产出物数量: {len(resp["data"])}')
for item in resp['data']:
    print(f'  - {item["name"]} ({item["artifact_type"]})')

print('\n=== 审核问题列表 ===')
req = urllib.request.Request(f'{BASE}/api/reviews/issues', headers=headers)
resp = json.loads(urllib.request.urlopen(req).read())
print(f'状态: {resp.get("error")}')
print(f'问题数量: {len(resp["data"])}')
for item in resp['data']:
    print(f'  - {item["description"][:30]}...')

print('\n=== 设置页 ===')
req = urllib.request.Request(f'{BASE}/api/settings', headers=headers)
resp = json.loads(urllib.request.urlopen(req).read())
print(f'状态: {resp.get("error")}')
print(f'设置数据: {json.dumps(resp["data"], ensure_ascii=False)[:500]}')

print('\n=== 用量概览 ===')
req = urllib.request.Request(f'{BASE}/api/usage/overview', headers=headers)
resp = json.loads(urllib.request.urlopen(req).read())
print(f'状态: {resp.get("error")}')
print(f'用量数据: {json.dumps(resp["data"], ensure_ascii=False)[:500]}')

print('\n=== 提示词模板 ===')
req = urllib.request.Request(f'{BASE}/api/prompts/templates', headers=headers)
try:
    resp = json.loads(urllib.request.urlopen(req).read())
    print(f'状态: {resp.get("error")}')
    print(f'模板数量: {len(resp["data"])}')
except Exception as e:
    print(f'获取失败: {e}')

print('\n=== Agent 模型列表 ===')
req = urllib.request.Request(f'{BASE}/api/agents/models', headers=headers)
try:
    resp = json.loads(urllib.request.urlopen(req).read())
    print(f'状态: {resp.get("error")}')
    print(f'模型数量: {len(resp["data"])}')
except Exception as e:
    print(f'获取失败: {e}')