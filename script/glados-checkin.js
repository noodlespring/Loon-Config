// GLaDOS 签到 Loon Cron — v4
console.log("=== GLaDOS 签到启动 ===");

var SUB_URL = "https://update.glados-config.com/subscribe/720019/cfc8333/116600/servers";
var K_C = "glados_cookie";
var COOKIE = $persistentStore.read(K_C) || "";

if (!COOKIE) {
  $notification.post("GLaDOS 签到", "未捕获 Cookie", "Safari 打开 glados.cloud/console/checkin 登录一次");
  $done();
}

var H = {
  "cookie": COOKIE,
  "content-type": "application/json;charset=UTF-8",
  "origin": "https://glados.cloud",
  "referer": "https://glados.cloud/console/checkin",
  "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
};

// ── 签到（重试 3 次，间隔 3 秒）──
function doCheckin(retry) {
  $httpClient.post({
    url: "https://glados.cloud/api/user/checkin",
    headers: H,
    body: JSON.stringify({ token: "glados.one" }),
    timeout: 15
  }, function(e1, r1, d1) {
    if (e1) {
      console.log("[1 FAIL attempt " + (4 - retry) + "] " + e1);
      if (retry > 1) {
        setTimeout(function() { doCheckin(retry - 1); }, 3000);
        return;
      }
      $notification.post("GLaDOS 签到失败", "签到接口超时（重试 3 次后）", "1. 检查代理是否正常\n2. 检查 glados.cloud 是否可访问\n3. 可能是签到接口限频，稍后手动重试");
      $done();
      return;
    }
    var ci = JSON.parse(d1 || "{}");
    console.log("[1] code=" + ci.code + " " + (ci.message||""));

    // Step 2: 状态
    $httpClient.get({ url: "https://glados.cloud/api/user/status", headers: H, timeout: 15 },
      function(e2, r2, d2) {
        if (e2) { console.log("[2 FAIL] " + e2); $notification.post("GLaDOS", "状态查询失败", String(e2)); $done(); return; }
        var st = JSON.parse(d2 || "{}");
        var d = st.data || {};
        var email = d.email || "";
        var left = String(d.leftDays != null ? d.leftDays : "?").split(".")[0];
        var pts = d.points != null ? d.points : "?";
        console.log("[2] " + email + " 剩" + left + "天 积" + pts);

        // Step 3: 流量
        $httpClient.get({ url: SUB_URL, headers: { "user-agent": "Loon/1" }, timeout: 15 },
          function(e3, r3) {
            var info = null;
            if (e3) { console.log("[3 FAIL] " + e3); }
            if (r3) {
              var hdrs = r3.headers || {};
              var raw = hdrs["subscription-userinfo"] || hdrs["Subscription-Userinfo"] || "";
              console.log("[3] userinfo=" + (raw || "空"));
              if (raw) info = parseUserInfo(raw);
            }
            notify(ci, email, left, pts, info);
          });
      });
  });
}
doCheckin(3);

function parseUserInfo(raw) {
  var o = {};
  raw.split(";").forEach(function(kv) { var p = kv.split("="); var k = (p[0]||"").trim().toLowerCase(); var v = (p[1]||"").trim(); if (k&&v) o[k]=v; });
  return o;
}
function fb(n) { if (!n||isNaN(n)) return "?"; var v=Number(n),i=0,u=["B","KB","MB","GB","TB"]; while(v>=1024&&i<4){v/=1024;i++;} return v.toFixed(2)+" "+u[i]; }
function fd(ts) { if (!ts) return "?"; var d=new Date(Number(ts)*1000); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }

function notify(ci, email, left, pts, info) {
  var title = ci.code===0 ? "✅ GLaDOS 签到成功" : ci.code===1 ? "ℹ️ GLaDOS 今日已签" : "⚠️ 签到异常(code=" + ci.code + ")";
  var sub = "📅 剩余 " + left + " 天 · ⭐ 积分 " + pts;
  var lines = [];
  if (email) lines.push("👤 " + email);
  if (info) {
    var up=Number(info.upload||0), down=Number(info.download||0), total=Number(info.total||0);
    var used=up+down, remain=total-used, pct=total>0?(used/total*100).toFixed(1):"?";
    lines.push("📊 " + fb(used) + " / " + fb(total) + " (" + pct + "%)");
    lines.push("   ↑" + fb(up) + "  ↓" + fb(down) + "  剩 " + fb(remain>0?remain:0));
    if (info.expire) lines.push("⏰ 到期 " + fd(info.expire));
  } else {
    lines.push("📊 流量: 请求失败，查看日志");
  }
  console.log("[NOTIFY] " + title + " | " + sub);
  $notification.post(title, sub, lines.join("\n"));
  $done();
}
