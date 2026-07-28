#!/bin/bash
# ============================================
# 小红书去视频动态 - Dylib 注入脚本
# 运行方式：在终端里直接运行，按提示输密码
# ============================================

set -e

APP="/Applications/小红书.app"
BINARY="$APP/Wrapper/discover.app/discover"
DYLIB="/tmp/XHSVideoFilter.dylib"

echo "📱 小红书去视频动态 v4.0 - 注入工具"
echo "======================================"

# 1. 关闭小红书
echo "🔪 关闭小红书..."
sudo killall discover 2>/dev/null || true
sleep 2

# 2. 卸载 nullfs 只读挂载
echo "📦 卸载只读挂载..."
sudo umount "$APP/Wrapper" 2>/dev/null || true
echo "✅ 已卸载"

# 3. 注入 dylib
echo "📝 复制 dylib..."
sudo mkdir -p "$APP/Wrapper/discover.app/Frameworks"
sudo cp "$DYLIB" "$APP/Wrapper/discover.app/Frameworks/XHSVideoFilter.dylib"

echo "🔧 设置权限..."
sudo chmod 777 "$BINARY"

echo "⚡ 注入加载命令..."
python3 /tmp/inject_dylib.py "$BINARY" "@executable_path/Frameworks/XHSVideoFilter.dylib"

echo "🔑 恢复权限..."
sudo chmod 755 "$BINARY"
sudo ldid -S "$BINARY" 2>/dev/null || true

# 4. 验证
echo "🔍 验证..."
otool -L "$BINARY" | grep XHSVideoFilter && echo "✅ 注入成功！" || echo "❌ 注入失败"

echo ""
echo "🎉 完成！请打开小红书 -> 首页推荐已自动过滤视频动态"
