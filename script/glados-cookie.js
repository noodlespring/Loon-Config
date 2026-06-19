// GLaDOS Cookie 自动捕获
var KEY = "glados_cookie";
try {
  var h = $request.headers || {};
  var c = "";
  for (var k in h) { if (k.toLowerCase() === "cookie") { c = h[k]; break; } }
  if (c && c.indexOf("koa:sess") !== -1) {
    var old = $persistentStore.read(KEY) || "";
    if (!old) {
      $persistentStore.write(c, KEY);
      $notification.post("GLaDOS Cookie 已捕获", "", "已可自动签到");
    } else if (c !== old) {
      $persistentStore.write(c, KEY);
      $notification.post("GLaDOS Cookie 已刷新", "", "已更新");
    }
  }
} catch(e) {}
$done({});
