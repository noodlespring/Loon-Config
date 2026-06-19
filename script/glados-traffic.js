// GLaDOS 流量嗅探 — http-response
console.log("[Traffic] " + (($response||{}).url||"").substring(0,80));
var KEY = "glados_traffic";
try {
  var body = ($response||{}).body || "";
  if (!body || body.length < 10) { $done({}); }
  var data = JSON.parse(body);
  var found = searchTraffic(data);
  if (found) {
    var old = $persistentStore.read(KEY) || "";
    var n = JSON.stringify(found);
    if (n !== old) {
      found._ts = Date.now();
      $persistentStore.write(JSON.stringify(found), KEY);
      var up = Number(found.upload||found.uplink||0);
      var down = Number(found.download||found.downlink||0);
      var total = Number(found.total||0);
      var used = up + down;
      console.log("[Traffic] ↑" + fmt(up) + " ↓" + fmt(down) + " / " + fmt(total));
      $notification.post("📊 GLaDOS 流量已捕获", "↑" + fmt(up) + "  ↓" + fmt(down) + " / " + fmt(total), total > 0 ? "已用 " + (used/total*100).toFixed(1) + "%" : "");
    }
  }
} catch(e) { console.log("[Traffic] " + e); }
$done({});

function searchTraffic(obj) {
  if (!obj || typeof obj !== "object") return null;
  var d = extract(obj);
  if (d) return d;
  for (var k in obj) { if (/data|result|user|info|stats|traffic|bandwidth|account/i.test(k)) { var c = searchTraffic(obj[k]); if (c) return c; } }
  return null;
}
function extract(o) {
  if (!o || typeof o !== "object") return null;
  var r = {}, h = false;
  if (o.upload != null || o.uplink != null) { r.upload = o.upload || o.uplink; h = true; }
  if (o.download != null || o.downlink != null) { r.download = o.download || o.downlink; h = true; }
  if (o.total != null) { r.total = o.total; h = true; }
  if (o.quota != null) { r.total = r.total || o.quota; h = true; }
  if (o.used != null) { r.used = o.used; if (!r.upload && !r.download) r.upload = o.used; h = true; }
  if (o.expire != null) { r.expire = o.expire; h = true; }
  if (o.expired_at != null) { r.expire = r.expire || o.expired_at; h = true; }
  if (o.expireDate != null) { r.expire = r.expire || o.expireDate; h = true; }
  return h ? r : null;
}
function fmt(n) { if (!n||isNaN(n)) return "0 B"; var v=Number(n),i=0,u=["B","KB","MB","GB","TB"]; while(v>=1024&&i<4){v/=1024;i++;} return v.toFixed(1)+" "+u[i]; }
