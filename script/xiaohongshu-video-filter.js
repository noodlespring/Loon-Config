const url = $request.url

if (!/edith\.xiaohongshu\.com\/api\/sns\/web\/v1\/(feed|homefeed|recommend)/.test(url)) {
  $done({})
  return
}

try {
  const body = JSON.parse($response.body)
  if (body?.data?.items) {
    const before = body.data.items.length
    body.data.items = body.data.items.filter(item => {
      if (item?.note_card?.type === 'video') return false
      if (item?.media_type === 2) return false
      return true
    })
    const filtered = before - body.data.items.length
    if (filtered > 0) {
      $notification.post('小红书过滤', '', `已过滤 ${filtered} 条视频动态`)
    }
    $done({ body: JSON.stringify(body) })
  } else {
    $done({})
  }
} catch (e) {
  $done({})
}
