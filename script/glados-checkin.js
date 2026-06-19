// GLaDOS 签到 — Loon Promise 版
console.log("=== GLaDOS 签到启动 ===");
var K_C = "glados_cookie";
var K_S = "glados_sub_url";
var K_T = "glados_traffic";
var COOKIE = $persistentStore.read(K_C) || "";
var SUB_URL = $persistentStore.read(K_S) || "";
var TRAFFIC = $persistentStore.read(K_T) || "";
console.log("Cookie:" + COOKIE.length + " Sub:" + (SUB_URL ? SUB_URL.length : 0) + " Traffic:" + (TRAFFIC ? TRAFFIC.length : 0));

if (!COOKIE) {
  $notification.post("GLaDOS 签到", "未捕获 Cookie", "Safari 打开 glados.cloud/console/checkin 登录一次");
  $done();
}

var H = { "cookie": COOKIE, "content-type": "application/json;charset=UTF-8", "origin": "https://glados.cloud", "referer": "https://glados.cloud/console/checkin", "user-agent": "Mozilla/5.0" };

// Step 1 签到
$task.fetch({ url: "https://glados.cloud/api/user/checkin", method: "POST", headers: H, body: JSON.stringify({ token: "glados.one" }) })
.then(function(r1) {
  var ci = JSON.parse(r1.body);
  console.log("[1] code=" + ci.code + " " + (ci.message||""));
  // Step 2 状态
  return $task.fetch({ url: "https://glados.cloud/api/user/status", method: "GET", headers: H })
    .then(function(r2) {
      var st = JSON.parse(r2.body);
      var d = st.data || {};
      var email = d.email || "";
      var left = String(d.leftDays != null ? d.leftDays : "?").split(".")[0];
      var pts = d.points != null ? d.points : "?";
      console.log("[2] " + email + " 剩" + left + "天 积" + pts);

      // 用已捕获的流量（如果有）
      var tInfo = null;
      if (TRAFFIC) {
        try { tInfo = JSON.parse(TRAFFIC); } catch(e) {}
        if (tInfo) console.log("[3] 缓存流量 ↑" + (tInfo.upload||0) + " ↓" + (tInfo.download||0));
      }

      // 如果还有订阅链接，追加拉 subscription-userinfo
      if (SUB_URL) {
        return $task.fetch({ url: SUB_URL, method: "GET", headers: { "user-agent": "Loon/1" } })
          .then(function(r3) {
            var raw = "";
            var hdrs = r3.headers || {};
            if (hdrs["subscription-userinfo"]) raw = hdrs["subscription-userinfo"];
            else if (hdrs["Subscription-Userinfo"]) raw = hdrs["Subscription-Userinfo"];
            if (raw) { var sub = parseUserInfo(raw); if (!tInfo) tInfo = sub; else { if (!tInfo.total && sub.total) tInfo.total = sub.total; if (!tInfo.expire && sub.expire) tInfo.expire = sub.expire; } }
            notify(ci, email, left, pts, tInfo);
          }, function() { notify(ci, email, left, pts, tInfo); });
      }
      notify(ci, email, left, pts, tInfo);
    });
})
.catch(function(e) {
  console.log("ERR " + JSON.stringify(e));
  $notification.post("GLaDOS 签到失败", "网络或 Cookie 错误", String(e));
  $done();
});

function parseUserInfo(r) {
  var o = {};
  r.split(";").forEach(function(kv) { var p = kv.split("="); var k = (p[0]||"").trim().toLowerCase(); var v = (p[1]||"").trim(); if (k&&v) o[k]=v; });
  return o;
}
function fb(n) { if (!n||isNaN(n)) return "?"; var v=Number(n),i=0,u=["B","KB","MB","GB","TB"]; while(v>=1024&&i<4){v/=1024;i++;} return v.toFixed(2)+" "+u[i]; }
function fd(ts) { if (!ts) return "?"; var d=new Date(Number(ts)*1000); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }

function notify(ci, email, left, pts, info) {
  var title = ci.code===0 ? "✅ GLaDOS 签到成功" : ci.code===1 ? "ℹ️ GLaDOS 今日已签" : "⚠️ 签到异常";
  var sub = "📅 剩余 " + left + " 天   ⭐ 积分 " + pts;
  var lines = [];
  if (email) lines.push("👤 " + email);
  if (ci.message) lines.push("💬 " + ci.message);
  if (info) {
    var up=Number(info.upload||0), down=Number(info.download||0), total=Number(info.total||0);
    var used=up+down, remain=total-used, pct=total>0?(used/total*100).toFixed(1):"?";
    lines.push("📊 " + fb(used) + " / " + fb(total) + " (" + pct + "%)");
    lines.push("   ↑" + fb(up) + "  ↓" + fb(down) + "  剩 " + fb(remain>0?remain:0));
    if (info.expire) lines.push("⏰ 到期 " + fd(info.expire));
  }
  console.log("[NOTIFY] " + title + " | " + sub);
  $notification.post(title, sub, lines.join("\n"));
  $done();
}
