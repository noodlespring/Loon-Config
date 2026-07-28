/**
 * 微信读书无限卡解锁 — 安全测试载荷
 * ============================================================================
 * 用途：授权红客测试 — 复现 MITM 响应篡改攻击
 * 攻击目标：i.weread.qq.com/pay/memberCardSummary
 * 攻击手段：拦截响应 → 替换为伪造的会员 JSON
 *
 * 红队操作还原说明：
 *   1. Loon MITM 解密 HTTPS 请求
 *   2. 本脚本劫持 /pay/memberCardSummary 响应
 *   3. 用硬编码会员数据覆盖原始服务端响应
 *   4. 客户端收到伪造数据后，显示无限卡已激活
 *
 * 修复验证：启用 SSL Pinning 后，插件将无法拦截该请求
 * ============================================================================
 * 测试日期：2026-07-28
 * 受测版本：微信读书 iOS
 */

// ============================================================================
// 配置区 — 修改以下字段可模拟不同测试场景
// ============================================================================
const TEST_CONFIG = {
  // 会员过期时间（Unix 秒）: 0x3aff795708 ≈ 公元 6295 年
  expiredTime: 253402300680,

  // 是否显示已过期（0=正常, 1=已过期）
  expired: 0,

  // "剩余时长"（秒）: 0xb2bd30d1 ≈ 95 年
  remainTime: 2999999569,

  // 会员等级标识（0=无限卡, 其他值可测试边界）
  permanent: 0,

  // 是否付费用户（0=非付费, 1=付费）
  isPaying: 0,

  // 签名（需与真实响应格式一致，用于测试完整性校验缺陷）
  signature: "63e6257faa3498333df963aff22884ddfb205c5cc0d7761bc84eac4b21de4edb",

  // 界面提示按钮文字（测试发现攻击者留下的彩蛋）
  buttonTitle: "无限卡已激活（测试）"
};

// ============================================================================
// 攻击载荷执行
// ============================================================================
(function () {
  // 记录原始响应（用于对比测试）
  let originalBody = "";
  try {
    originalBody = $response.body;
    const original = JSON.parse(originalBody);
    console.log(
      "[WeRead-Security-Test] 原始响应 intercepted: " +
        JSON.stringify({
          expiredTime: original.expiredTime,
          expired: original.expired,
          isPaying: original.isPaying,
        })
    );
  } catch (e) {
    console.log("[WeRead-Security-Test] 原始响应不是有效 JSON，将完全替换");
  }

  // ======================================================================
  // 伪造的会员响应体
  // 这是攻击者实际使用的 payload，结构完全模仿服务端真实响应
  // 客户端仅根据这些字段判断会员状态，无额外校验
  // ======================================================================
  const fakeResponse = {
    startTime: Math.floor(Date.now() / 1000) - 86400, // 一天前（动态）
    expiredTime: TEST_CONFIG.expiredTime,
    expired: TEST_CONFIG.expired,
    isPaying: TEST_CONFIG.isPaying,
    permanent: TEST_CONFIG.permanent,
    day: 48,
    remainTime: TEST_CONFIG.remainTime,
    payingRemainTime: 0,
    canUseDiscount: 0,
    payingUsedDay: 0,
    mcardHint: "",
    timestamp: Math.floor(Date.now() / 1000),
    random: Math.floor(Math.random() * 10000),
    signature: TEST_CONFIG.signature,
    isAutoRenewable: 0,
    historyAutoRenewable: 0,
    autoRenewableChannel: 0,
    autoRenewableTime: 0,
    autoRenewablePrice: 1900,
    savedMoney: 2213,
    totalFreeReadDay: 0,
    remainCoupon: 0,
    remainCount: 0,
    hintsForRecharge: {
      predictedSavedMoney: 10315,
      predictedChapterPrice: 15,
      pricePerMonth: 900,
      sendCoupons: 0,
      buttonTitle: TEST_CONFIG.buttonTitle,
      buttonSubtitle: "安全测试中 — 非实际开通",
    },
    freeBookIds: [],
  };

  const fakeBody = JSON.stringify(fakeResponse);

  console.log(
    "[WeRead-Security-Test] ✅ 攻击载荷已注入 — 伪造会员过期时间=" +
      new Date(TEST_CONFIG.expiredTime * 1000).toISOString()
  );

  $done({ body: fakeBody });
})();
