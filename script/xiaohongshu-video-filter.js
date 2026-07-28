// ==ClaudeCode==
// 小红书去视频动态 v3.2.0 - 适配iOS rec.xiaohongshu.com
// ==/ClaudeCode==

const url = $request.url
const urlShort = url.replace(/^https?:\/\//, '')
const now = new Date().toLocaleString('zh-CN', {hour12: false})

function log(msg) {
  console.log(`[${now}] ${msg}`)
}

log(`=== XHS v3.2.0 触发 === URL: ${urlShort.substring(0, 150)}`)

try {
  const body = JSON.parse($response.body)

  // ------ iOS: rec.xiaohongshu.com 返回 data 是数组 ------
  if (body?.data && Array.isArray(body.data) && body.data.length > 0) {
    const total = body.data.length
    let videoCount = 0
    let samples = []

    log(`[iOS] 发现data数组! 共${total}条`)

    body.data = body.data.filter(item => {
      const noteType = item?.note_card?.type || item?.type || '?'
      const mediaType = item?.media_type ?? '?'
      const isVideo = noteType === 'video'
      const isMediaType2 = mediaType === 2
      const itemId = (item?.id || item?.note_card?.note_id || '?').substring(0, 16)

      if (isVideo || isMediaType2) {
        videoCount++
        samples.push(`过滤 id=${itemId} t:${noteType} m:${mediaType}`)
        return false
      }
      return true
    })

    const filtered = total - body.data.length
    samples.forEach(s => log(s))
    log(`[iOS] 结果: ${body.data.length}/${total}, 过滤${filtered}条视频`)

    if (filtered > 0) {
      $notification.post('小红书过滤', `iOS过滤 ${filtered} 条`, `共${total}条视频`)
    }
    $done({ body: JSON.stringify(body) })
    return
  }

  // ------ Web/其他: data.items ------
  if (body?.data?.items && Array.isArray(body.data.items) && body.data.items.length > 0) {
    const total = body.data.items.length
    let videoCount = 0
    let samples = []

    log(`[Web] 发现items数组! 共${total}条`)

    body.data.items = body.data.items.filter(item => {
      const noteType = item?.note_card?.type || '?'
      const mediaType = item?.media_type ?? '?'
      const isVideo = noteType === 'video'
      const isMediaType2 = mediaType === 2
      const itemId = (item?.id || item?.note_card?.note_id || '?').substring(0, 16)

      if (isVideo || isMediaType2) {
        videoCount++
        samples.push(`过滤 id=${itemId} t:${noteType} m:${mediaType}`)
        return false
      }
      return true
    })

    const filtered = total - body.data.items.length
    samples.forEach(s => log(s))
    log(`[Web] 结果: ${body.data.items.length}/${total}, 过滤${filtered}条视频`)

    if (filtered > 0) {
      $notification.post('小红书过滤', `Web过滤 ${filtered} 条`, `共${total}条`)
    }
    $done({ body: JSON.stringify(body) })
    return
  }

  // ------ 没有匹配的数据结构 ------
  const dataType = body?.data ? (Array.isArray(body.data) ? '空数组' : `keys=${Object.keys(body.data).join(',').substring(0, 80)}`) : 'no data'
  log(`跳过: ${urlShort.substring(0, 100)} | data=${dataType}`)
  $done({})

} catch (e) {
  log(`非JSON: ${urlShort.substring(0, 100)}`)
  $done({})
}
