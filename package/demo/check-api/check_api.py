"""Check API status and test key endpoints"""
import urllib.request
import json
import sys

BASE = "http://localhost:8000"

def api(path, method="GET", data=None, token=None):
    url = f"{BASE}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"error": e.code, "body": e.read().decode()}
    except Exception as e:
        return {"error": str(e)}

# 1. Health check
print("=== 1. Health Check ===")
print(api("/api/health"))

# 2. Login
print("\n=== 2. Login ===")
login_result = api("/api/auth/login", method="POST", data={
    "email": "test2@test.com",
    "password": "Test123456"
})
print(json.dumps(login_result, indent=2, ensure_ascii=False))

if "data" in login_result and "access_token" in login_result["data"]:
    token = login_result["data"]["access_token"]
    print(f"\nToken obtained: {token[:20]}...")
    
    # 3. Dashboard
    print("\n=== 3. Dashboard ===")
    print(json.dumps(api("/api/dashboard", token=token), indent=2, ensure_ascii=False))
    
    # 4. Projects list
    print("\n=== 4. Projects ===")
    print(json.dumps(api("/api/projects", token=token), indent=2, ensure_ascii=False))
    
    # 5. Reviews
    print("\n=== 5. Reviews ===")
    print(json.dumps(api("/api/reviews", token=token), indent=2, ensure_ascii=False))
    
    # 6. Settings
    print("\n=== 6. Settings ===")
    print(json.dumps(api("/api/settings", token=token), indent=2, ensure_ascii=False))
    
    # 7. Usage
    print("\n=== 7. Usage ===")
    print(json.dumps(api("/api/usage", token=token), indent=2, ensure_ascii=False))
    
    # 8. Agent config
    print("\n=== 8. Agent Config ===")
    print(json.dumps(api("/api/agents/config", token=token), indent=2, ensure_ascii=False))
else:
    print("Login failed, can't test further")