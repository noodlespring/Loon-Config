// GLaDOS 签到 for Loon — 完整通知版
console.log("=== GLaDOS 签到启动 ===");

var COOKIE_KEY = "glados_cookie";
var SUB_KEY    = "glados_sub_url";
var COOKIE     = $persistentStore.read(COOKIE_KEY) || "";
var SUB_URL    = $persistentStore.read(SUB_KEY) || "";

console.log("Cookie 长度: " + COOKIE.length);
console.log("订阅URL: " + (SUB_URL ? SUB_URL.substring(0, 60) + "..." : "无"));

if (!COOKIE) {
  console.log("[FAIL] Cookie 为空，终止");
  $notification.post("❌ GLaDOS 签到", "未捕获 Cookie", "用 Safari 打开 https://glados.cloud/console/checkin 登录一次即可自动捕获");
  $done();
}

var H = {
  "cookie": COOKIE,
  "content-type": "application/json;charset=UTF-8",
  "origin": "https://glados.cloud",
  "referer": "https://glados.cloud/console/checkin",
  "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
};

// ── 签到 ──
console.log("[1/3] 签到...");
$task.fetch({ url: "https://glados.cloud/api/user/checkin", method: "POST", headers: H, body: JSON.stringify({ token: "glados.one" }) },
  function(e1, r1, d1) {
    if (e1) { console.log("[1/3 FAIL] " + JSON.stringify(e1)); $notification.post("❌ GLaDOS 签到失败", "网络请求错误", "签到接口不可达，请检查代理"); $done(); return; }
    var ci = {}; try { ci = JSON.parse(d1); } catch(_) {}
    console.log("[1/3 OK] code=" + ci.code + " " + (ci.message||""));

    // ── 查状态 ──
    console.log("[2/3] 查状态...");
    $task.fetch({ url: "https://glados.cloud/api/user/status", method: "GET", headers: H },
      function(e2, r2, d2) {
        if (e2) { console.log("[2/3 FAIL] " + JSON.stringify(e2)); $notification.post("❌ GLaDOS", "状态查询失败", String(e2)); $done(); return; }
        var st = {}; try { st = JSON.parse(d2); } catch(_) {}
        var d = st.data || {};
        var email = d.email || "";
        var left  = String(d.leftDays != null ? d.leftDays : "?").split(".")[0];
        var pts   = (d.points != null ? d.points : "?");
        console.log("[2/3 OK] " + email + " 剩" + left + "天 积" + pts);

        // ── 流量（可选）──
        if (!SUB_URL) { console.log("[3/3 SKIP] 无订阅URL"); notify(ci, email, left, pts, null); return; }
        console.log("[3/3] 拉流量...");
        $task.fetch({ url: SUB_URL, method: "GET", headers: { "user-agent": "Loon/1.0" } },
          function(e3, r3) {
            var info = null;
            if (e3) { console.log("[3/3 WARN] " + JSON.stringify(e3)); }
            else {
              var h = r3.headers || {};
              var raw = h["subscription-userinfo"] || h["Subscription-Userinfo"] || "";
              console.log("[3/3 OK] userinfo=" + (raw ? raw.substring(0,80)+"..." : "空"));
              if (raw) info = parseUserInfo(raw);
            }
            notify(ci, email, left, pts, info);
          });
      });
  });

// ── helpers ──
function parseUserInfo(raw) {
  var o = {};
  raw.split(";").forEach(function(kv) {
    var p = kv.split("=");
    var k = (p[0]||"").trim().toLowerCase();
    var v = (p[1]||"").trim();
    if (k&&v) o[k]=v;
  });
  return o;
}
function fb(n) {
  if (!n||isNaN(n)) return "?";
  var v=Number(n),i=0,u=["B","KB","MB","GB","TB"];
  while(v>=1024&&i<4){v/=1024;i++;}
  return v.toFixed(2)+" "+u[i];
}
function fd(ts){ if(!ts)return"?"; var d=new Date(Number(ts)*1000); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }

function notify(ci, email, left, pts, info) {
  var title, status = ci.code;
  if (status === 0)      title = "✅ GLaDOS 签到成功";
  else if (status === 1) title = "ℹ️ GLaDOS 今日已签";
  else                   title = "⚠️ GLaDOS 签到异常 (code=" + status + ")";

  var sub = "📅 剩余 " + left + " 天   ⭐ 积分 " + pts;
  var lines = [];
  if (email)     lines.push("👤 " + email);
  if (ci.message) lines.push("💬 " + ci.message);

  if (info) {
    var up=Number(info.upload||0), down=Number(info.download||0), total=Number(info.total||0);
    var used=up+down, remain=total-used;
    var pct=total>0?(used/total*100).toFixed(1):"?";
    lines.push("📊 " + fb(used) + " / " + fb(total) + " (" + pct + "%)");
    lines.push("   ↑" + fb(up) + "  ↓" + fb(down) + "  剩 " + fb(remain>0?remain:0));
    if (info.expire) lines.push("⏰ 到期 " + fd(info.expire));
  }

  console.log("[NOTIFY] " + title + " | " + sub);
  $notification.post(title, sub, lines.join("\n"));
  $done();
}
