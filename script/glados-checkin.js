// GLaDOS 签到 Loon Cron — $httpClient 版
console.log("=== GLaDOS 签到启动 ===");

var K_C = "glados_cookie";
var K_T = "glados_traffic";
var COOKIE = $persistentStore.read(K_C) || "";
var TRAFFIC = $persistentStore.read(K_T) || "";
console.log("Cookie:" + COOKIE.length + " 缓存流量:" + (TRAFFIC ? "有" : "无"));

if (!COOKIE) {
  $notification.post("GLaDOS 签到", "未捕获 Cookie", "Safari 打开 glados.cloud/console/checkin 登录");
  $done();
}

var H = {
  "cookie": COOKIE,
  "content-type": "application/json;charset=UTF-8",
  "origin": "https://glados.cloud",
  "referer": "https://glados.cloud/console/checkin",
  "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
};

// Step 1: 签到
$httpClient.post({
  url: "https://glados.cloud/api/user/checkin",
  headers: H,
  body: JSON.stringify({ token: "glados.one" })
}, function(e1, r1, d1) {
  if (e1) {
    console.log("[1 FAIL] " + JSON.stringify(e1));
    $notification.post("GLaDOS 签到失败", "网络错误", String(e1));
    $done();
    return;
  }
  var ci = JSON.parse(d1 || "{}");
  console.log("[1 OK] code=" + ci.code + " " + (ci.message||""));

  // Step 2: 查状态
  $httpClient.get({
    url: "https://glados.cloud/api/user/status",
    headers: H
  }, function(e2, r2, d2) {
    if (e2) {
      console.log("[2 FAIL] " + JSON.stringify(e2));
      $notification.post("GLaDOS", "状态查询失败", String(e2));
      $done();
      return;
    }
    var st = JSON.parse(d2 || "{}");
    var d = st.data || {};
    var email = d.email || "";
    var left = String(d.leftDays != null ? d.leftDays : "?").split(".")[0];
    var pts = d.points != null ? d.points : "?";
    console.log("[2 OK] " + email + " 剩" + left + "天 积" + pts);

    // Step 3: 流量
    var tInfo = null;
    if (TRAFFIC) {
      try { tInfo = JSON.parse(TRAFFIC); } catch(e) {}
      if (tInfo) {
        console.log("[3] 流量 ↑" + (tInfo.upload||0) + " ↓" + (tInfo.download||0) + " / " + (tInfo.total||0));
      }
    } else {
      console.log("[3] 无缓存流量（Safari 打开 glados.cloud/console/account 一次即可自动抓取）");
    }
    notify(ci, email, left, pts, tInfo);
  });
});

function fb(n) { if (!n||isNaN(n)) return "?"; var v=Number(n),i=0,u=["B","KB","MB","GB","TB"]; while(v>=1024&&i<4){v/=1024;i++;} return v.toFixed(2)+" "+u[i]; }
function fd(ts) { if (!ts) return "?"; var d=new Date(Number(ts)*1000); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }

function notify(ci, email, left, pts, info) {
  var title = ci.code===0 ? "✅ GLaDOS 签到成功" : ci.code===1 ? "ℹ️ GLaDOS 今日已签" : "⚠️ 签到异常(code=" + ci.code + ")";
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
