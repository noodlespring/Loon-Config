const url = $request.url

console.log('=== 小红书过滤脚本触发 ===')
console.log('URL:', url)

if (!/edith\.xiaohongshu\.com\/api\/sns\/web\/v1\/(feed|homefeed|recommend)/.test(url)) {
  console.log('URL不匹配，跳过')
  $done({})
  return
}

try {
  const body = JSON.parse($response.body)
  const bodySize = $response.body ? $response.body.length : 0
  console.log('响应体大小:', bodySize, 'bytes')

  if (body?.data?.items) {
    const total = body.data.items.length
    console.log('总条目数:', total)

    body.data.items = body.data.items.filter(item => {
      const noteType = item?.note_card?.type || 'unknown'
      const mediaType = item?.media_type ?? 'undefined'
      const itemId = item?.id || item?.note_card?.note_id || 'unknown'
      const isVideo = noteType === 'video'
      const isMediaType2 = mediaType === 2

      if (isVideo || isMediaType2) {
        console.log(`  [过滤] id=${itemId} type=${noteType} media_type=${mediaType} 原因:${isVideo ? 'note_card.type=video' : ''} ${isMediaType2 ? 'media_type=2' : ''}`)
        return false
      } else {
        console.log(`  [保留] id=${itemId} type=${noteType} media_type=${mediaType}`)
        return true
      }
    })

    const filtered = total - body.data.items.length
    console.log(`过滤结果: 保留${body.data.items.length}/${total}，已过滤${filtered}条视频动态`)

    if (filtered > 0) {
      $notification.post('小红书过滤', '', `已过滤 ${filtered} 条视频动态`)
    }
    $done({ body: JSON.stringify(body) })
  } else {
    console.log('响应中没有 data.items 字段，跳过')
    console.log('body keys:', Object.keys(body || {}).join(','))
    $done({})
  }
} catch (e) {
  console.log('脚本异常:', e.message || e)
  $done({})
}
