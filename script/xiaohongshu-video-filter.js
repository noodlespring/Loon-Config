// ==ClaudeCode==
// 小红书去视频动态 v3.1.1 - 改用console.log诊断
// ==/ClaudeCode==

const url = $request.url
const urlShort = url.replace(/^https?:\/\//, '')

console.log('=== XHS v3.1.1 触发 ===')
console.log('URL:', urlShort)

// 检查是否有 data.items（不依赖URL路径）
try {
  const body = JSON.parse($response.body)

  if (body?.data?.items && Array.isArray(body.data.items) && body.data.items.length > 0) {
    const total = body.data.items.length
    let videoCount = 0

    console.log(`发现items数组! 共${total}条, URL路径: ${urlShort.substring(0, 100)}`)

    body.data.items = body.data.items.filter(item => {
      const noteType = item?.note_card?.type || '?'
      const mediaType = item?.media_type ?? '?'
      const isVideo = noteType === 'video'
      const isMediaType2 = mediaType === 2
      const itemId = item?.id || item?.note_card?.note_id || '?'

      if (isVideo || isMediaType2) {
        videoCount++
        console.log(`  [过滤] id=${itemId} t:${noteType} m:${mediaType}`)
        return false
      }
      console.log(`  [保留] id=${itemId} t:${noteType} m:${mediaType}`)
      return true
    })

    const filtered = total - body.data.items.length
    console.log(`结果: ${body.data.items.length}/${total}, 过滤${filtered}条视频`)

    if (filtered > 0) {
      $notification.post('小红书过滤', `已过滤 ${filtered} 条`, `路径: ${urlShort.substring(0, 80)}`)
    }

    $done({ body: JSON.stringify(body) })
  } else {
    const hasItems = body?.data?.items ? `items空数组` : '无items字段'
    const path = urlShort.substring(0, 80)
    console.log(`跳过: ${path} (${hasItems})`)
    $done({})
  }
} catch (e) {
  console.log(`解析失败(非JSON): ${urlShort.substring(0, 60)}`)
  $done({})
}
