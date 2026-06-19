// GLaDOS 订阅链接自动捕获
var KEY = "glados_sub_url";
try {
  var u = $request.url || "";
  if (/^https?:\/\/glados\.cloud\/subscribe\//.test(u)) {
    var old = $persistentStore.read(KEY) || "";
    if (u !== old) {
      $persistentStore.write(u, KEY);
      $notification.post("GLaDOS 订阅链接已捕获", "", "已记录");
    }
  }
} catch(e) {}
$done({});
