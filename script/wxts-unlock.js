/**
 * 微信听书会员解锁 — 安全测试载荷
 * ============================================================================
 * 用途：授权红客测试 — 复现 MITM 响应篡改攻击
 * 攻击目标：i.at.qq.com/pay/memberinfo
 * 攻击手段：拦截响应 → 替换为伪造的永久会员 JSON
 *
 * 红队操作还原说明：
 *   1. Loon MITM 解密 HTTPS 请求
 *   2. 本脚本劫持 /pay/memberinfo 响应
 *   3. 用硬编码的永久会员数据覆盖原始响应
 *   4. 客户端收到后显示为永久会员，解锁全部听书功能
 *
 * 风险说明：此 API 对应的脚本在网络上以 未混淆 的明文形式传播
 *           说明攻击者认为几乎没有被检测的风险
 * ============================================================================
 * 测试日期：2026-07-28
 * 受测版本：微信听书 iOS
 */

// ============================================================================
// 配置区 — 修改以下字段可模拟不同测试场景
// ============================================================================
const TEST_CONFIG = {
  // 是否会员（1=会员, 0=非会员 — 仅此字段决定会员状态）
  isMember: 1,

  // 是否自动续费
  isAutoRenewable: 1,

  // 过期时间（Unix 秒）: 4092647115 ≈ 2099 年
  endTime: 4092647115,

  // 剩余秒数
  expiresIn: 999999999,

  // 订阅描述（客户端直接展示此文本）
  subscriptionDesc: "永久会员（安全测试）",

  // 是否拥有促销权益
  hasPromoRight: false,
};

// ============================================================================
// 攻击载荷执行
// ============================================================================
(function () {
  // 记录原始响应（用于对比测试）
  try {
    const original = JSON.parse($response.body);
    console.log(
      "[WxTs-Security-Test] 原始响应 intercepted: " +
        JSON.stringify({
          isMember: original.isMember,
          endTime: original.endTime,
          subscriptionDesc: original.subscriptionDesc,
        })
    );
  } catch (e) {
    console.log("[WxTs-Security-Test] 原始响应解析失败，将完全替换");
  }

  // ======================================================================
  // 伪造的会员响应体
  // 这是攻击者实际使用的 payload — 仅设置 isMember=1 即可解锁所有听书功能
  // 客户端不对这些字段做任何服务端二次验证
  // ======================================================================
  const fakeResponse = {
    isMember: TEST_CONFIG.isMember,
    isAutoRenewable: TEST_CONFIG.isAutoRenewable,
    startTime: Math.floor(Date.now() / 1000) - 86400 * 30, // 30天前（动态）
    endTime: TEST_CONFIG.endTime,
    autoRenewableChannel: 0,
    autoRenewableTime: 0,
    expiresIn: TEST_CONFIG.expiresIn,
    subscriptionPeriod: 1,
    subscriptionPrice: 999999,
    historyAutoRenewable: true,
    hasPromoRight: TEST_CONFIG.hasPromoRight,
    subscriptionDesc: TEST_CONFIG.subscriptionDesc,
    subscriptionButtonLabel: "",
  };

  const fakeBody = JSON.stringify(fakeResponse);

  console.log(
    "[WxTs-Security-Test] ✅ 攻击载荷已注入 — 伪造 isMember=" +
      TEST_CONFIG.isMember +
      ", endTime=" +
      new Date(TEST_CONFIG.endTime * 1000).toISOString()
  );

  $done({ body: fakeBody });
})();
