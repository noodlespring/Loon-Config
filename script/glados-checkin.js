// GLaDOS 签到 for Loon — debug 版
console.log("=== GLaDOS 签到脚本启动 ===");

var COOKIE_KEY = "glados_cookie";
var SUB_KEY = "glados_sub_url";
var COOKIE = $persistentStore.read(COOKIE_KEY) || "";
var SUB_URL = $persistentStore.read(SUB_KEY) || "";

console.log("Cookie 长度: " + COOKIE.length);
console.log("订阅 URL 长度: " + (SUB_URL ? SUB_URL.length : 0));

if (!COOKIE) {
  console.log("[FAIL] 未捕获 Cookie，发送通知后退出");
  $notification.post("GLaDOS 签到", "未捕获 Cookie", "Safari 打开 glados.cloud 登录一次");
  $done();
}

var apiHeaders = {
  "cookie": COOKIE,
  "content-type": "application/json;charset=UTF-8",
  "origin": "https://glados.cloud",
  "referer": "https://glados.cloud/console/checkin",
  "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
};

// Step 1: 签到
console.log("[Step 1] 正在签到...");
$task.fetch({
  url: "https://glados.cloud/api/user/checkin",
  method: "POST",
  headers: apiHeaders,
  body: JSON.stringify({ token: "glados.one" })
}, function(err1, resp1, data1) {
  if (err1) {
    console.log("[Step 1 FAIL] 签到请求失败: " + JSON.stringify(err1));
    $notification.post("GLaDOS 签到失败", "Cookie 可能已过期", "Safari 重新登录 glados.cloud");
    $done();
    return;
  }
  console.log("[Step 1 OK] 签到响应: " + (data1 ? data1.substring(0, 100) : "null"));
  var ci = {};
  try { ci = JSON.parse(data1); } catch(e) { console.log("[Step 1 WARN] JSON 解析失败: " + e); }
  console.log("[Step 1] code=" + ci.code + " message=" + (ci.message || "null"));

  // Step 2: 查状态
  console.log("[Step 2] 正在查状态...");
  $task.fetch({
    url: "https://glados.cloud/api/user/status",
    method: "GET",
    headers: apiHeaders
  }, function(err2, resp2, data2) {
    if (err2) {
      console.log("[Step 2 FAIL] 状态查询失败: " + JSON.stringify(err2));
      $notification.post("GLaDOS", "状态查询失败", String(err2));
      $done();
      return;
    }
    console.log("[Step 2 OK] 状态响应: " + (data2 ? data2.substring(0, 100) : "null"));
    var st = {};
    try { st = JSON.parse(data2); } catch(e) { console.log("[Step 2 WARN] JSON 解析失败: " + e); }
    var d = st.data || {};
    var email = d.email || "";
    var left = String(d.leftDays != null ? d.leftDays : "?").split(".")[0];
    var points = d.points != null ? d.points : "?";
    console.log("[Step 2] email=" + email + " leftDays=" + left + " points=" + points);

    // Step 3: 流量（可选）
    if (!SUB_URL) {
      console.log("[Step 3 SKIP] 未捕获订阅 URL");
      notify(ci, email, left, points, null);
      return;
    }
    console.log("[Step 3] 正在拉订阅流量...");
    $task.fetch({
      url: SUB_URL,
      method: "GET",
      headers: { "user-agent": "Loon/1.0 (GLaDOS-checkin)" }
    }, function(err3, resp3, data3) {
      var info = null;
      if (err3) {
        console.log("[Step 3 WARN] 订阅请求失败: " + JSON.stringify(err3));
      } else {
        var raw = (resp3.headers || {})["subscription-userinfo"] || (resp3.headers || {})["Subscription-Userinfo"] || "";
        console.log("[Step 3 OK] subscription-userinfo: " + (raw || "无"));
        if (raw) info = parseUserInfo(raw);
      }
      notify(ci, email, left, points, info);
    });
  });
});

// ─── helpers ────────────────────────────────────────────
function parseUserInfo(raw) {
  var out = {};
  var pairs = raw.split(";");
  for (var i = 0; i < pairs.length; i++) {
    var kv = pairs[i].split("=");
    var k = (kv[0] || "").trim().toLowerCase();
    var v = (kv[1] || "").trim();
    if (k && v) out[k] = v;
  }
  return out;
}

function fmtBytes(n) {
  if (!n || isNaN(n)) return "?";
  var v = Number(n), i = 0, u = ["B","KB","MB","GB","TB"];
  while (v >= 1024 && i < 4) { v /= 1024; i++; }
  return v.toFixed(2) + " " + u[i];
}

function fmtDate(ts) {
  if (!ts) return "?";
  var d = new Date(Number(ts) * 1000);
  return d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate();
}

function notify(ci, email, left, points, info) {
  console.log("[Notify] code=" + ci.code + " left=" + left + " points=" + points);
  var title = ci.code === 0 ? "GLaDOS 签到成功" : ci.code === 1 ? "GLaDOS 今日已签" : "GLaDOS 签到异常";
  var sub = "剩余 " + left + " 天  积分 " + points;
  var lines = [];
  if (email) lines.push(email);
  if (ci.message) lines.push(ci.message);
  if (info) {
    var upN = Number(info.upload||0), downN = Number(info.download||0), totalN = Number(info.total||0);
    var used = upN + downN, remain = totalN - used;
    var pct = totalN > 0 ? (used/totalN*100).toFixed(1) : "?";
    lines.push("流量 " + fmtBytes(used) + " / " + fmtBytes(totalN) + " (" + pct + "%)");
    lines.push("↑" + fmtBytes(upN) + " ↓" + fmtBytes(downN) + " 剩 " + fmtBytes(remain > 0 ? remain : 0));
    if (info.expire) lines.push("到期 " + fmtDate(info.expire));
  }
  console.log("[Notify] " + title + " | " + sub);
  $notification.post(title, sub, lines.join("\n"));
  $done();
}
