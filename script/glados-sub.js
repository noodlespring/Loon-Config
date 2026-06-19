// GLaDOS 订阅链接捕获 — 通知版
console.log("[Sub] 触发 — " + ($request.url||"").substring(0, 80));
var KEY = "glados_sub_url";
try {
  var u = $request.url || "";
  if (/^https?:\/\/glados\.cloud\/subscribe\//.test(u)) {
    var old = $persistentStore.read(KEY) || "";
    if (u !== old) {
      $persistentStore.write(u, KEY);
      console.log("[Sub] 已捕获 — " + u.substring(0, 60) + "...");
      $notification.post("🔗 GLaDOS 订阅链接已捕获", "下次签到将一并显示流量", u.length > 50 ? u.substring(0, 50)+"..." : u);
    } else {
      console.log("[Sub] 未变化，跳过");
    }
  } else {
    console.log("[Sub] URL 不匹配 subscribe，忽略");
  }
} catch(e) { console.log("[Sub] 异常: " + e); }
$done({});
