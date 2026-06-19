// GLaDOS Cookie 捕获 — 通知版
console.log("[Cookie] 触发 — " + ($request.url||"").substring(0, 80));
var KEY = "glados_cookie";
try {
  var h = $request.headers || {};
  var c = "";
  for (var k in h) { if (k.toLowerCase()==="cookie") { c=h[k]; break; } }
  if (c && c.indexOf("koa:sess") !== -1) {
    var old = $persistentStore.read(KEY) || "";
    if (!old) {
      $persistentStore.write(c, KEY);
      console.log("[Cookie] 首次捕获 — 长度 " + c.length);
      $notification.post("🍪 GLaDOS Cookie 已捕获", "首次获取成功", "现在可自动签到了，建议去脚本页手动跑一次 GLaDOS签到 确认");
    } else if (c !== old) {
      $persistentStore.write(c, KEY);
      console.log("[Cookie] 已刷新 — 长度 " + c.length);
      $notification.post("🔄 GLaDOS Cookie 已刷新", "Cookie 已更新", "下次签到将使用新 Cookie");
    } else {
      console.log("[Cookie] 未变化，跳过");
    }
  } else {
    console.log("[Cookie] 未检测到 koa:sess，忽略");
  }
} catch(e) { console.log("[Cookie] 异常: " + e); }
$done({});
