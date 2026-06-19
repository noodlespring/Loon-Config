// ================================================================
//  GLaDOS 订阅链接自动捕获 — Loon http-request 脚本
//  ---------------------------------------------------------------
//  触发条件：访问路径匹配 /subscribe/ 的请求
//  行为：把完整订阅 URL 写入 $persistentStore
//        签到脚本会用它拉 subscription-userinfo 读流量
//  成功标志：通知「🔗 GLaDOS 订阅链接已捕获」
//  操作步骤：
//    1. 浏览器/代理 App 打开你的 GLaDOS 订阅 URL
//       （GLaDOS 控制台 → 随便点一个节点 → Subscribe URL）
//    2. Safari 打开该 URL（看到乱码/下载提示即可）
//    3. 应收到「🔗 订阅链接已捕获」通知
//  若无通知：
//    1. 确认 MITM 已开 + 证书已信任
//    2. 确认 hostname 包含 glados.cloud
//    3. 确认 URL 包含 /subscribe/（不是 /sub?token=xxx 这种）
//    4. 查看本脚本日志定位
// ================================================================

console.log("[Sub] 触发 — " + ($request.url || "").substring(0, 80));
var KEY = "glados_sub_url";
try {
  var u = $request.url || "";
  if (/^https?:\/\/glados\.cloud\/subscribe\//.test(u)) {
    var old = $persistentStore.read(KEY) || "";
    if (u !== old) {
      $persistentStore.write(u, KEY);
      console.log("[Sub] 已捕获 — " + u.substring(0, 60) + "...");
      $notification.post(
        "🔗 GLaDOS 订阅链接已捕获",
        "下次签到将一并显示流量",
        u.length > 50 ? u.substring(0, 50) + "..." : u
      );
    } else {
      console.log("[Sub] 未变化，跳过");
    }
  } else {
    console.log("[Sub] URL 不匹配 /subscribe/，忽略");
  }
} catch (e) { console.log("[Sub] 异常: " + e); }
$done({});
