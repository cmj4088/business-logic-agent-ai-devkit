"""测试插件系统 API。"""
import httpx
import asyncio
import json

async def test():
    client = httpx.AsyncClient(base_url='http://localhost:8000')

    # 登录
    r = await client.post('/api/auth/login', json={
        'email': 'admin@ipd.com',
        'password': 'Admin123456!'
    })
    token = r.json()['data']['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    # 先卸载之前安装的 web_search
    await client.delete('/api/plugins/web_search', headers=headers)

    # 获取可用插件列表
    r = await client.get('/api/plugins/available', headers=headers)
    data = r.json()['data']
    print(f'可用插件 ({len(data)} 个):')
    for p in data:
        print(f'  - {p["plugin_id"]}: {p["name"]} (分类: {p["category"]}) [已安装: {p["installed"]}]')

    # 安装所有插件
    plugins_to_install = ['web_search', 'ipd-xlsx', 'ipd-docx', 'ipd-data-analysis']
    for pid in plugins_to_install:
        r = await client.post('/api/plugins/install', headers=headers, json={'plugin_id': pid})
        if r.status_code == 200:
            print(f'OK 安装成功: {pid}')
        else:
            print(f'FAIL 安装失败 {pid}: {r.json()["error"]["message"]}')

    # 获取已安装插件
    r = await client.get('/api/plugins', headers=headers)
    installed = r.json()['data']
    print(f'\n已安装插件 ({len(installed)} 个):')
    for p in installed:
        tools = [t['tool_name'] for t in p['tools']]
        print(f'  - {p["plugin_id"]}: {p["name"]} v{p["version"]} [启用: {p["enabled"]}] tools: {tools}')

    # 测试插件连接
    for p in installed:
        r = await client.post(f'/api/plugins/{p["plugin_id"]}/test', headers=headers)
        result = r.json()['data']
        status = 'OK' if result['success'] else 'FAIL'
        print(f'  {status} 测试 {p["plugin_id"]}: {result["message"]}')

asyncio.run(test())