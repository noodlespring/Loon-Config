// ================================================================
//  GLaDOS Cookie 自动捕获 — Loon http-request 脚本
//  ---------------------------------------------------------------
//  触发条件：Loon MITM 解密 glados.cloud 时，命中 API 请求
//  （/api/user/status 或 /api/user/checkin）
//  行为：从请求头提取 koa:sess 写入 $persistentStore
//  成功标志：
//    - 首次 → 通知「🍪 GLaDOS Cookie 已捕获」
//    - 刷新 → 通知「🔄 GLaDOS Cookie 已刷新」
//  失败排查：Loon → 脚本 → GLaDOS-Cookie捕获 → 日志
//    常见原因：
//      1. Loon MITM 未开启
//      2. 证书未安装/未信任
//      3. hostname 未包含 glados.cloud（插件会自动加）
// ================================================================

console.log("[Cookie] 触发 — " + ($request.url || "").substring(0, 80));
var KEY = "glados_cookie";
try {
  var h = $request.headers || {};
  var c = "";
  for (var k in h) { if (k.toLowerCase() === "cookie") { c = h[k]; break; } }

  if (c && c.indexOf("koa:sess") !== -1) {
    var old = $persistentStore.read(KEY) || "";
    if (!old) {
      $persistentStore.write(c, KEY);
      console.log("[Cookie] 首次捕获成功 — 长度 " + c.length);
      $notification.post(
        "🍪 GLaDOS Cookie 已捕获",
        "首次获取成功",
        "1. 去 Loon 脚本页找到「GLaDOS签到」\n2. 点 ▶️ 手动跑一次\n3. 应收到「✅ 签到成功」或「ℹ️ 今日已签」"
      );
    } else if (c !== old) {
      $persistentStore.write(c, KEY);
      console.log("[Cookie] 已刷新 — 长度 " + c.length);
      $notification.post(
        "🔄 GLaDOS Cookie 已刷新",
        "Cookie 已更新",
        "下次签到将使用新 Cookie"
      );
    } else {
      console.log("[Cookie] 未变化，跳过");
    }
  } else {
    console.log("[Cookie] 未检测到 koa:sess，忽略此请求");
  }
} catch (e) { console.log("[Cookie] 异常: " + e); }
$done({});
