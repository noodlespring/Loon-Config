const url = $request.url

if (!/edith\.xiaohongshu\.com\/api\/sns\/web\/v1\/(feed|homefeed|recommend)/.test(url)) {
  $done({})
  return
}

try {
  const body = JSON.parse($response.body)

  if (body?.data?.items) {
    const total = body.data.items.length
    let videoCount = 0
    let debugInfo = ['', `条目:${total}`]

    body.data.items = body.data.items.filter(item => {
      const noteType = item?.note_card?.type || '?'
      const mediaType = item?.media_type ?? '?'
      const isVideo = noteType === 'video'
      const isMediaType2 = mediaType === 2
      if (isVideo || isMediaType2) {
        videoCount++
        debugInfo.push(`✕ t:${noteType} m:${mediaType}`)
        return false
      }
      return true
    })

    const filtered = total - body.data.items.length
    debugInfo[0] = `保留${body.data.items.length}/${total} 过滤${filtered}`

    // 弹窗显示 (最多3条item信息，防太长)
    let subtitle = debugInfo.slice(0, 4).join(' │ ')
    if (debugInfo.length > 4) subtitle += ` │ +${debugInfo.length - 4}条`
    $notification.post('小红书过滤', subtitle, videoCount > 0 ? `已过滤 ${filtered} 条视频动态` : '无视频动态')

    $done({ body: JSON.stringify(body) })
  } else {
    $notification.post('小红书过滤', '⚠️ 无items字段', `body keys: ${Object.keys(body || {}).join(',')}`)
    $done({})
  }
} catch (e) {
  $notification.post('小红书过滤', '❌ 异常', e.message || e)
  $done({})
}
