// ==ClaudeCode==
// 小红书去视频动态 v3.1.0
// 全路径匹配，只要有 data.items 就尝试过滤视频
// ==/ClaudeCode==

const url = $request.url

// 缩短URL用于显示
const urlShort = url.replace(/^https?:\/\//, '').substring(0, 180)

// ---- 弹URL诊断（所有edith请求） ----
$notification.post('📡 XHS ' + urlShort.substring(0, 40), urlShort.substring(0, 80), urlShort.substring(80, 200) || '')

try {
  const body = JSON.parse($response.body)

  // 检查有没有 data.items（不管URL路径）
  if (body?.data?.items && Array.isArray(body.data.items) && body.data.items.length > 0) {
    const total = body.data.items.length
    let videoCount = 0
    let debugInfo = ['', `条目:${total}`]
    let firstVideoId = ''

    body.data.items = body.data.items.filter(item => {
      const noteType = item?.note_card?.type || '?'
      const mediaType = item?.media_type ?? '?'
      const isVideo = noteType === 'video'
      const isMediaType2 = mediaType === 2
      if (isVideo || isMediaType2) {
        videoCount++
        if (!firstVideoId) firstVideoId = item?.id || item?.note_card?.note_id || ''
        debugInfo.push(`✕ t:${noteType} m:${mediaType}`)
        return false
      }
      return true
    })

    const filtered = total - body.data.items.length
    debugInfo[0] = `✅ 保留${body.data.items.length}/${total} 过滤${filtered}`

    let subtitle = debugInfo.slice(0, 4).join(' │ ')
    if (debugInfo.length > 4) subtitle += ` │ +${debugInfo.length - 4}条`
    $notification.post('🎯 XHS过滤', subtitle, videoCount > 0 ? `过滤 ${filtered} 条视频 // ${firstVideoId.substring(0, 30)}` : '无视频动态')

    $done({ body: JSON.stringify(body) })
  } else {
    // 有body但无items，显示部分body keys
    const keys = Object.keys(body || {}).join(',')
    const dataKeys = body?.data ? Object.keys(body.data).join(',') : 'no data'
    if (body?.data?.items && body.data.items.length === 0) {
      $notification.post('ℹ️ XHS', 'items为空数组', dataKeys.substring(0, 120))
    }
    $done({})
  }
} catch (e) {
  // 解析失败可能是非JSON响应，忽略
  $done({})
}
