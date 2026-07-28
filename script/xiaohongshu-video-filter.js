// 小红书去视频动态 v4.0.0
// 支持 iOS (rec.xiaohongshu.com) + Web (edith.xiaohongshu.com)

const url = $request.url

try {
  const body = JSON.parse($response.body)

  // iOS: rec.xiaohongshu.com/api/sns/v6/homefeed → data 是数组
  if (body?.data && Array.isArray(body.data) && body.data.length > 0) {
    const total = body.data.length
    body.data = body.data.filter(item => {
      if (item?.note_card?.type === 'video') return false
      if (item?.media_type === 2) return false
      return true
    })
    const filtered = total - body.data.length
    if (filtered > 0) $notification.post('小红书过滤', `已过滤 ${filtered} 条视频`, `共${total}条`)
    $done({ body: JSON.stringify(body) })
    return
  }

  // Web: edith.xiaohongshu.com/api/sns/web/v1/... → data.items 是数组
  if (body?.data?.items && Array.isArray(body.data.items) && body.data.items.length > 0) {
    const total = body.data.items.length
    body.data.items = body.data.items.filter(item => {
      if (item?.note_card?.type === 'video') return false
      if (item?.media_type === 2) return false
      return true
    })
    const filtered = total - body.data.items.length
    if (filtered > 0) $notification.post('小红书过滤', `已过滤 ${filtered} 条视频`, `共${total}条`)
    $done({ body: JSON.stringify(body) })
    return
  }

  $done({})
} catch (e) {
  $done({})
}
