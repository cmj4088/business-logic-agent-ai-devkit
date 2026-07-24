"""BLA 比赛服务器启动器 — 零配置一键启动。

功能：
  1. 自动检测本机局域网 IP
  2. 安装依赖（如有需要）
  3. 生成 JWT 密钥（首次）
  4. 创建公网隧道（可选）— 评委从任何网络都能访问
  5. 启动后端服务 + 托管前端
  6. 显示二维码供扫码访问
  7. 打开浏览器

用法：
  python server_launcher.py
  python server_launcher.py --public   # 自动创建公网地址，不询问
"""
import os
import sys
import socket
import subprocess
import webbrowser
import shutil
import signal
import threading
import re
import time
from pathlib import Path
from typing import Optional

# ── 路径 ──────────────────────────────────────────────────────────────
PROJECT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_DIR / "backend"
FRONTEND_DIST = PROJECT_DIR / "frontend" / "dist"
CONFIG_FILE = BACKEND_DIR / "config.yaml"
TOOLS_DIR = PROJECT_DIR / ".tools"
CLOUDFLARED_PATH = TOOLS_DIR / ("cloudflared.exe" if os.name == "nt" else "cloudflared")


# ── 终端颜色 ──────────────────────────────────────────────────────────
class Colors:
    """终端 ANSI 颜色（Windows 兼容）。"""
    RESET = "\033[0m"
    BOLD = "\033[1m"
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    MAGENTA = "\033[95m"
    WHITE = "\033[97m"
    BG_DARK = "\033[40m"
    BG_BLUE = "\033[44m"


def print_banner():
    """打印启动横幅（纯 ASCII，全平台兼容）。"""
    line = "+" + "-" * 55 + "+"
    print()
    print(f"{Colors.CYAN}{Colors.BOLD}{line}{Colors.RESET}")
    print(f"{Colors.CYAN}{Colors.BOLD}|  Business Logic Agent - 比赛服务器{' ' * 22}|{Colors.RESET}")
    print(f"{Colors.CYAN}{Colors.BOLD}|{' ' * 55}|{Colors.RESET}")
    print(f"{Colors.CYAN}{Colors.BOLD}|  评委打开浏览器扫码或输入地址即可使用{' ' * 18}|{Colors.RESET}")
    print(f"{Colors.CYAN}{Colors.BOLD}{line}{Colors.RESET}")
    print()


def detect_lan_ip() -> str:
    """检测本机局域网 IP 地址。"""
    try:
        # 创建一个 UDP socket 连接到一个公网 IP（实际上不发送数据）
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        pass

    # 备选方案：遍历网络接口
    try:
        hostname = socket.gethostname()
        for addr in socket.gethostbyname_ex(hostname)[2]:
            if addr.startswith(("192.", "10.", "172.")):
                return addr
    except Exception:
        pass

    return "127.0.0.1"


def check_python_deps() -> bool:
    """检查 Python 依赖是否齐全。"""
    required = ["uvicorn", "fastapi", "aiosqlite", "yaml", "pydantic"]
    missing = []
    for mod in required:
        try:
            __import__(mod)
        except ImportError:
            missing.append(mod)

    if missing:
        print(f"{Colors.YELLOW}  ⏳ 安装依赖: {', '.join(missing)}...{Colors.RESET}")
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r",
             str(BACKEND_DIR / "requirements.txt"), "-q"],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            print(f"{Colors.RED}  ❌ 安装失败: {result.stderr}{Colors.RESET}")
            return False
        print(f"{Colors.GREEN}  ✅ 依赖安装完成{Colors.RESET}")
    else:
        print(f"{Colors.GREEN}  ✅ Python 依赖已就绪{Colors.RESET}")
    return True


def ensure_config():
    """确保 JWT 和加密密钥已配置。"""
    if CONFIG_FILE.exists():
        print(f"{Colors.GREEN}  ✅ 配置已存在{Colors.RESET}")
        return

    print(f"{Colors.YELLOW}  ⏳ 首次运行，生成密钥...{Colors.RESET}")

    import secrets
    from cryptography.fernet import Fernet

    jwt_key = secrets.token_hex(32)
    fernet_key = Fernet.generate_key().decode()

    config_content = f"""# Business Logic Agent 配置
# 由 server_launcher.py 自动生成

app_name: "Business Logic Agent"
app_version: "0.1.0"
debug: false

jwt_secret: "{jwt_key}"
jwt_algorithm: HS256
session_token_expire_minutes: 60
refresh_token_expire_days: 30

fernet_key: "{fernet_key}"

llm_default: ollama
ollama_base_url: "http://localhost:11434"
ollama_default_model: "qwen2.5"

database_path: "data/ipd_agent.db"
log_level: INFO
"""
    CONFIG_FILE.write_text(config_content, encoding="utf-8")
    print(f"{Colors.GREEN}  ✅ 密钥已生成{Colors.RESET}")


def generate_qr_code(url: str) -> str:
    """生成 QR 码的纯 ASCII 版本（Windows 兼容）。

    依赖 qrcode 库（首次使用自动安装）。
    """
    try:
        import qrcode

        qr = qrcode.QRCode(border=1, box_size=1)
        qr.add_data(url)
        qr.make()

        lines = []
        matrix = qr.get_matrix()
        n = len(matrix[0])
        lines.append("  +" + "--" * n + "+")
        for row in matrix:
            line = "  |"
            for cell in row:
                line += "##" if cell else "  "
            line += "|"
            lines.append(line)
        lines.append("  +" + "--" * n * 2 + "+"[:n * 2])
        lines.append("")
        return "\n".join(lines)

    except ImportError:
        try:
            subprocess.run(
                [sys.executable, "-m", "pip", "install", "qrcode[pil]", "-q"],
                capture_output=True, timeout=30
            )
            import qrcode  # type: ignore
            return generate_qr_code(url)
        except Exception:
            return ""


def print_connection_info(ip: str, port: int = 8000):
    """显示连接信息（大字体 + QR 码，纯 ASCII）。"""
    url = f"http://{ip}:{port}"

    # 大号 URL 框
    pad = max(0, 49 - len(url)) // 2
    print(f"{Colors.GREEN}{Colors.BOLD}" + "+" + "-" * 49 + "+" + f"{Colors.RESET}")
    print(f"{Colors.GREEN}{Colors.BOLD}|{' ' * 49}|{Colors.RESET}")
    print(f"{Colors.GREEN}{Colors.BOLD}|{' ' * pad}{url}{' ' * (49 - pad - len(url))}|{Colors.RESET}")
    print(f"{Colors.GREEN}{Colors.BOLD}|{' ' * 49}|{Colors.RESET}")
    print(f"{Colors.GREEN}{Colors.BOLD}" + "+" + "-" * 49 + "+" + f"{Colors.RESET}")
    print()
    print(f"  评委扫码或在浏览器输入上方地址即可使用")
    print()

    # QR 码
    qr = generate_qr_code(url)
    if qr:
        print(f"  [QR Code] 手机扫码快速打开:")
        print(f"{qr}")
        print()

    print(f"  本机访问:  http://localhost:{port}")
    print(f"  API 文档:  http://localhost:{port}/docs")
    print()
    print(f"  [提示] 请确保防火墙允许端口 {port} 的入站连接")
    print(f"  [提示] 按 Ctrl+C 停止服务器")
    print()


def open_browser(url: str):
    """打开浏览器访问地址。"""
    try:
        webbrowser.open(url)
    except Exception:
        pass


def print_starting():
    """打印「正在启动」信息。"""
    print(f"{Colors.GREEN}{Colors.BOLD}+- Starting server... -+{Colors.RESET}")


def print_ready(ip: str, port: int = 8000):
    """打印服务器已就绪信息。"""
    url = f"http://{ip}:{port}"
    print()
    print(f"{Colors.GREEN}{Colors.BOLD}+=============================================+{Colors.RESET}")
    print(f"{Colors.GREEN}{Colors.BOLD}|        Server is READY!                    |{Colors.RESET}")
    print(f"{Colors.GREEN}{Colors.BOLD}|   Judges visit:                            |{Colors.RESET}")
    print(f"{Colors.GREEN}{Colors.BOLD}+---------------------------------------------+{Colors.RESET}")
    print(f"{Colors.WHITE}{Colors.BG_BLUE}{Colors.BOLD}  {url}  {Colors.RESET}")
    print(f"{Colors.GREEN}{Colors.BOLD}+=============================================+{Colors.RESET}")
    print()
    print(f"  Press Ctrl+C to stop the server")
    print()


# ── 公网隧道 ─────────────────────────────────────────────────────────

def download_cloudflared() -> Optional[Path]:
    """下载 cloudflared（用于创建公网隧道）。"""
    TOOLS_DIR.mkdir(parents=True, exist_ok=True)

    if CLOUDFLARED_PATH.exists():
        return CLOUDFLARED_PATH

    print(f"{Colors.YELLOW}  ⏳ 下载 cloudflared（公网隧道工具）...{Colors.RESET}")

    # 确定下载 URL
    system = "windows" if os.name == "nt" else "linux"
    arch = "amd64"
    url = f"https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-{system}-{arch}"

    if os.name == "nt":
        url += ".exe"

    # 国内镜像（GitHub 下载慢时备用）
    mirror_url = (
        f"https://ghfast.top/https://github.com/cloudflare/cloudflared/"
        f"releases/latest/download/cloudflared-{system}-{arch}"
    )
    if os.name == "nt":
        mirror_url += ".exe"

    for dl_url in [url, mirror_url]:
        try:
            import urllib.request
            urllib.request.urlretrieve(dl_url, str(CLOUDFLARED_PATH))
            CLOUDFLARED_PATH.chmod(0o755)
            print(f"{Colors.GREEN}  ✅ cloudflared 下载完成{Colors.RESET}")
            return CLOUDFLARED_PATH
        except Exception:
            continue

    print(f"{Colors.YELLOW}  ⚠ cloudflared 下载失败，将仅使用局域网{Colors.RESET}")
    return None


def start_tunnel(port: int = 8000) -> tuple:
    """启动 cloudflared 隧道，返回 (进程, 公网URL)。

    返回 (None, None) 表示隧道启动失败。
    """
    cf_path = download_cloudflared()
    if not cf_path:
        return None, None

    print(f"{Colors.CYAN}  ⏳ 创建公网隧道...{Colors.RESET}")

    try:
        proc = subprocess.Popen(
            [str(cf_path), "tunnel", "--url", f"http://localhost:{port}",
             "--no-autoupdate"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
        )

        # 从输出中提取公网 URL
        public_url = None
        start_time = time.time()
        timeout = 30  # 30 秒超时

        while time.time() - start_time < timeout:
            line = proc.stdout.readline() if proc.stdout else ""
            if not line:
                break
            print(f"    {line.strip()}")
            # cloudflared 输出格式: "https://xxxx.trycloudflare.com"
            match = re.search(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', line)
            if match:
                public_url = match.group(0)
                break

        if public_url:
            print(f"{Colors.GREEN}  ✅ 公网地址: {public_url}{Colors.RESET}")
            return proc, public_url
        else:
            print(f"{Colors.YELLOW}  ⚠ 隧道启动超时，将仅使用局域网{Colors.RESET}")
            proc.terminate()
            return None, None

    except Exception as e:
        print(f"{Colors.YELLOW}  ⚠ 隧道启动失败: {e}{Colors.RESET}")
        return None, None


def ask_tunnel() -> bool:
    """询问用户是否创建公网隧道。"""
    if "--public" in sys.argv:
        return True

    print()
    print(f"{Colors.CYAN}[选项]{Colors.RESET} 是否需要创建公网地址？")
    print(f"  {Colors.YELLOW}  评委从任何网络都能访问（需要下载 20MB 工具）{Colors.RESET}")
    resp = input(f"  {Colors.GREEN}创建公网地址? (Y/n): {Colors.RESET}").strip().lower()
    return resp != "n"


def print_tunnel_prompt():
    """如果用户不想用隧道，给出自行配置公网访问的提示。"""
    print()
    print(f"{Colors.YELLOW}[提示]{Colors.RESET} 如果评委和你不在同一个网络，你可以:")
    print(f"  1. 使用内网穿透工具: https://natapp.cn 或 https://ngrok.com")
    print(f"  2. 配置路由器端口转发（需要公网 IP）")
    print(f"  3. 用 TeamViewer/ToDesk 等远程桌面给评委看")
    print()


def main():
    # 设置工作目录
    os.chdir(BACKEND_DIR)

    # 清屏
    os.system("cls" if os.name == "nt" else "clear")

    # 显示横幅
    print_banner()

    # ── 1. 检测 IP ──
    print(f"{Colors.CYAN}[1/4]{Colors.RESET} 检测网络 ...")
    ip = detect_lan_ip()
    print(f"  ✅ 本机 IP: {Colors.GREEN}{ip}{Colors.RESET}")
    print()

    # ── 2. 检查依赖 ──
    print(f"{Colors.CYAN}[2/4]{Colors.RESET} 检查 Python 环境 ...")
    if not check_python_deps():
        input(f"\n{Colors.RED}按回车退出{Colors.RESET}")
        sys.exit(1)
    print()

    # ── 3. 配置 ──
    print(f"{Colors.CYAN}[3/4]{Colors.RESET} 检查配置 ...")
    ensure_config()

    # 检查/构建前端
    if FRONTEND_DIST.exists() and (FRONTEND_DIST / "index.html").exists():
        print(f"  ✅ 前端已构建，直接使用生产模式")
    else:
        print(f"  {Colors.YELLOW}  ⏳ 正在构建前端（首次需要，约 30 秒）...{Colors.RESET}")
        npm_path = shutil.which("npm")
        if npm_path:
            print(f"  {Colors.YELLOW}  使用 npm {' '.join(['=' * 20])}{Colors.RESET}")
            result = subprocess.run(
                [npm_path, "run", "build"],
                cwd=str(FRONTEND_DIST.parent),
                capture_output=True, text=True
            )
            if result.returncode == 0:
                print(f"  {Colors.GREEN}  ✅ 前端构建成功！{Colors.RESET}")
            else:
                print(f"  {Colors.RED}  ❌ 前端构建失败{Colors.RESET}")
                print(f"  {Colors.YELLOW}  请尝试在 frontend 目录下运行: npm install && npm run build{Colors.RESET}")
                input(f"\n{Colors.RED}按回车退出{Colors.RESET}")
                sys.exit(1)
        else:
            print(f"  {Colors.RED}  ❌ 未检测到 Node.js/npm！{Colors.RESET}")
            print(f"  {Colors.YELLOW}  请先安装 Node.js (https://nodejs.org) 或确保 frontend/dist 目录存在{Colors.RESET}")
            input(f"\n{Colors.RED}按回车退出{Colors.RESET}")
            sys.exit(1)
    print()

    # ── 4. 公网隧道（可选）──
    tunnel_proc = None
    public_url = None

    want_tunnel = ask_tunnel()
    if want_tunnel:
        print(f"{Colors.CYAN}[4/5]{Colors.RESET} 创建公网隧道 ...")
        tunnel_proc, public_url = start_tunnel()
        print()
    else:
        print_tunnel_prompt()
        print(f"{Colors.CYAN}[4/5]{Colors.RESET} 跳过，仅使用局域网")

    print()

    # ── 5. 启动 ──
    print(f"{Colors.CYAN}[5/5]{Colors.RESET} 启动服务 ...")

    # 设置环境变量
    env = os.environ.copy()
    env["PYTHONPATH"] = f"{BACKEND_DIR};{PROJECT_DIR}"
    env["CORS_ORIGINS"] = "*"
    env["APP_NAME"] = "Business Logic Agent"
    env["APP_VERSION"] = "0.1.0"
    env["LLM_DEFAULT"] = "ollama"
    env["OLLAMA_BASE_URL"] = "http://localhost:11434"

    # 显示连接信息
    print()
    print(f"{Colors.CYAN}{'=' * 55}{Colors.RESET}")
    print(f"{Colors.CYAN}{Colors.BOLD}  📡 连接地址{Colors.RESET}")
    print(f"{Colors.CYAN}{'=' * 55}{Colors.RESET}")
    print()

    # 局域网地址
    lan_url = f"http://{ip}:8000"
    qr = generate_qr_code(lan_url)
    print(f"  {Colors.GREEN}🏠 局域网:{Colors.RESET}")
    print(f"     {lan_url}")
    if qr:
        print(f"{qr}")
    print()

    # 公网地址（如果有）
    if public_url:
        pub_qr = generate_qr_code(public_url)
        print(f"  {Colors.MAGENTA}🌐 公网（任何网络可用）:{Colors.RESET}")
        print(f"     {public_url}")
        if pub_qr:
            print(f"{pub_qr}")
        print()

    print(f"  📍 本机访问:  http://localhost:8000")
    print(f"  📋 API 文档:  http://localhost:8000/docs")
    print()
    print(f"  {Colors.YELLOW}[提示] 按 Ctrl+C 停止服务器{Colors.RESET}")
    print(f"{Colors.CYAN}{'=' * 55}{Colors.RESET}")
    print()

    # 打开浏览器
    open_browser(f"http://localhost:8000")

    # 显示启动中
    print_starting()

    try:
        # 启动 uvicorn
        subprocess.run(
            [sys.executable, "-m", "uvicorn", "m0_infrastructure.main:app",
             "--host", "0.0.0.0", "--port", "8000",
             "--log-level", "info"],
            env=env,
            check=True
        )
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}🛑 服务器已停止{Colors.RESET}")
    except Exception as e:
        print(f"\n{Colors.RED}❌ 启动失败: {e}{Colors.RESET}")

        # 常见错误提示
        err_str = str(e)
        if "Address already in use" in err_str or "端口" in err_str:
            print(f"\n{Colors.YELLOW}  💡 提示: 端口 8000 已被占用")
            print(f"     请关闭已运行的服务后再试")
            print(f"     或修改端口: python server_launcher.py --port 8001{Colors.RESET}")
        elif "No module named" in err_str:
            print(f"\n{Colors.YELLOW}  💡 提示: Python 模块缺失，尝试运行:")
            print(f"     pip install -r backend/requirements.txt{Colors.RESET}")

        input(f"\n{Colors.RED}按回车退出{Colors.RESET}")
    finally:
        # 清理：停止隧道
        if tunnel_proc:
            print("  正在关闭公网隧道...")
            tunnel_proc.terminate()


if __name__ == "__main__":
    main()
