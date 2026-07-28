const contentType = $response.headers['Content-Type'] || $response.headers['content-type'] || ''

if (contentType.startsWith('video/')) {
  $done({
    status: 200,
    headers: { 'Content-Type': 'text/plain', 'Content-Length': '0' },
    body: ''
  })
} else {
  $done({})
}
