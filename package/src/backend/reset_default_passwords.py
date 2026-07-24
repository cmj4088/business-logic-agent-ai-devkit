"""重置默认账号密码为已知值。

默认账号：
  - admin@ipd.com  → Admin123456!
  - demo@bla.com   → demo123456
"""
import sqlite3
import bcrypt
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "ipd_agent.db")

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# admin@ipd.com → Admin123456!
admin_hash = hash_password("Admin123456!")
cur.execute("UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?",
            (admin_hash, "2026-07-18 14:00:00", "admin@ipd.com"))
print(f"admin@ipd.com: {cur.rowcount} row(s) updated")

# demo@bla.com → demo123456
demo_hash = hash_password("demo123456")
cur.execute("UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?",
            (demo_hash, "2026-07-18 14:00:00", "demo@bla.com"))
print(f"demo@bla.com: {cur.rowcount} row(s) updated")

conn.commit()

# 验证
for email in ["admin@ipd.com", "demo@bla.com"]:
    cur.execute("SELECT id, email, display_name FROM users WHERE email = ?", (email,))
    user = cur.fetchone()
    if user:
        print(f"OK: {user[1]} ({user[2]}) — 密码已重置")
    else:
        print(f"NOT FOUND: {email}")

conn.close()
print("Done.")
