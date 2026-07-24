#!/bin/bash
# Clash Meta (Mihomo) 内核下载脚本 — Linux 版
# 用法: chmod +x download-clash-meta.sh && sudo bash download-clash-meta.sh

set -e

echo "========================================"
echo "  Clash Meta (Mihomo) 内核下载 - Linux"
echo "========================================"

# ---- 获取最新版本 ----
echo ""
echo "[1/3] 获取最新版本号..."
LATEST=$(curl -s https://api.github.com/repos/MetaCubeX/mihomo/releases/latest | grep tag_name | cut -d'"' -f4)

if [ -z "$LATEST" ]; then
    echo "  ! 获取失败，使用默认版本 v1.19.27"
    LATEST="v1.19.27"
fi
echo "  最新版本: $LATEST"

VERSION="${LATEST#v}"
FILENAME="mihomo-linux-amd64-${VERSION}.gz"
DOWNLOAD_URL="https://github.com/MetaCubeX/mihomo/releases/download/${LATEST}/${FILENAME}"

# ---- 下载 ----
echo ""
echo "[2/3] 下载 Mihomo 内核..."
echo "  下载地址: $DOWNLOAD_URL"

curl -L --progress-bar -o "/tmp/${FILENAME}" "$DOWNLOAD_URL"

if [ $? -ne 0 ] || [ ! -f "/tmp/${FILENAME}" ]; then
    echo "  [!] 下载失败！请检查网络连接"
    echo "  提示: 如果被墙，可尝试:"
    echo "    export https_proxy=http://127.0.0.1:7890"
    echo "    然后再运行本脚本"
    exit 1
fi
echo "  下载完成!"

# ---- 安装 ----
echo ""
echo "[3/3] 安装到 /usr/local/bin/mihomo..."
gunzip -f -k "/tmp/${FILENAME}"
chmod +x "/tmp/mihomo-linux-amd64-${VERSION}"
mv "/tmp/mihomo-linux-amd64-${VERSION}" /usr/local/bin/mihomo
rm -f "/tmp/${FILENAME}"

echo ""
echo "========================================"
echo "  安装完成!"
echo "========================================"
echo ""
echo "  版本: ${LATEST}"
echo "  位置: /usr/local/bin/mihomo"
echo ""
echo "  验证: mihomo --version"
echo ""

# 验证
mihomo --version 2>/dev/null || echo "  (验证需要运行 mihomo --version)"
