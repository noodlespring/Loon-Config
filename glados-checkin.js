// GLaDOS 签到 for Loon
var COOKIE_KEY = "glados_cookie";
var SUB_KEY = "glados_sub_url";
var COOKIE = $persistentStore.read(COOKIE_KEY) || "";
var SUB_URL = $persistentStore.read(SUB_KEY) || "";

if (!COOKIE) {
  $notification.post("GLaDOS 签到", "未捕获 Cookie", "Safari 打开 glados.cloud 登录一次");
  $done();
}

var H = {
  "cookie": COOKIE,
  "content-type": "application/json;charset=UTF-8",
  "origin": "https://glados.cloud",
  "referer": "https://glados.cloud/console/checkin",
  "user-agent": "Mozilla/5.0"
};

$task.fetch({ url: "https://glados.cloud/api/user/checkin", method: "POST", headers: H, body: JSON.stringify({ token: "glados.one" }) })
.then(function(r1) {
  var ci = JSON.parse(r1.body);
  return $task.fetch({ url: "https://glados.cloud/api/user/status", method: "GET", headers: H })
    .then(function(r2) {
      var st = JSON.parse(r2.body);
      var d = st.data || {};
      var email = d.email || "";
      var left = String(d.leftDays != null ? d.leftDays : "?").split(".")[0];
      var points = d.points != null ? d.points : "?";

      if (SUB_URL) {
        return $task.fetch({ url: SUB_URL, method: "GET", headers: { "user-agent": "Loon/1" } })
          .then(function(r3) {
            var raw = "";
            var h = r3.headers || {};
            if (h["subscription-userinfo"]) raw = h["subscription-userinfo"];
            else if (h["Subscription-Userinfo"]) raw = h["Subscription-Userinfo"];
            notify(ci, email, left, points, raw ? parseUserInfo(raw) : null);
          }, function() { notify(ci, email, left, points, null); });
      } else { notify(ci, email, left, points, null); }
    });
}, function() {
  $notification.post("GLaDOS 签到失败", "Cookie 过期", "Safari 重新登录 glados.cloud");
  $done();
});

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
  var title = ci.code === 0 ? "GLaDOS 签到成功" : ci.code === 1 ? "GLaDOS 今日已签" : "GLaDOS 签到异常";
  var sub = "剩余 " + left + " 天 积分 " + points;
  var lines = [];
  if (email) lines.push(email);
  if (ci.message) lines.push(ci.message);
  if (info) {
    var up = Number(info.upload||0), down = Number(info.download||0), total = Number(info.total||0);
    var used = up + down, remain = total - used, pct = total > 0 ? (used/total*100).toFixed(1) : "?";
    lines.push("流量 " + fmtBytes(used) + " / " + fmtBytes(total) + " (" + pct + "%)");
    lines.push("↑" + fmtBytes(up) + " ↓" + fmtBytes(down) + " 剩 " + fmtBytes(remain > 0 ? remain : 0));
    if (info.expire) lines.push("到期 " + fmtDate(info.expire));
  }
  $notification.post(title, sub, lines.join("\n"));
  $done();
}
