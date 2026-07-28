// ==ClaudeCode==
// 小红书去视频动态 v3.1.2 - 日志写入/tmp
// ==/ClaudeCode==

const url = $request.url
const urlShort = url.replace(/^https?:\/\//, '')
const now = new Date().toLocaleString('zh-CN', {hour12: false})

// 写日志到/tmp
function log(msg) {
  const line = `[${now}] ${msg}\n`
  // 通过 $persistentStore 或直接写文件 - Loon不支持写文件，用 console.log
  console.log(line)
}

log(`=== XHS v3.1.2 触发 === URL: ${urlShort.substring(0, 150)}`)

try {
  const body = JSON.parse($response.body)

  if (body?.data?.items && Array.isArray(body.data.items)) {
    const total = body.data.items.length
    let videoCount = 0
    let samples = []

    log(`发现items! 共${total}条 PATH: ${urlShort.substring(0, 100)}`)

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
    log(`结果: ${body.data.items.length}/${total}, 过滤${filtered}`)

    if (filtered > 0) {
      $notification.post('小红书过滤', `已过滤 ${filtered} 条`, `共${total}条`)
    }
    $done({ body: JSON.stringify(body) })
  } else {
    const hasData = body?.data ? Object.keys(body.data).join(',') : 'no data'
    log(`跳过: ${urlShort.substring(0, 80)} | data.keys=${hasData.substring(0, 80)}`)
    $done({})
  }
} catch (e) {
  log(`非JSON: ${urlShort.substring(0, 80)}`)
  $done({})
}
