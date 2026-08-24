/*
 * オフラインでも開けるようにするための裏方（サービスワーカー）。
 *
 * ねらいは2つ。
 *   ・電波がなくても、いつもどおり記録できること
 *     （記録そのものは端末の中なので、画面さえ出れば書ける）
 *   ・ホーム画面に追加したときアプリらしく起動すること
 *
 * ファイル名はビルドのたびに変わるので、あらかじめ一覧を持たない。
 * 一度読んだものを控えておき、次回はそれを使いつつ裏で更新する方式にしている。
 */

const CACHE = 'kiso-taion-v1'

// 最低限これだけは先に control下に置く
const CORE = ['./', './index.html', './manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .catch(() => {
        // 1つでも取れないと addAll は失敗する。入れられなくても起動は続ける
      })
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return
  if (new URL(request.url).origin !== self.location.origin) return

  // 画面そのものを開くとき：まず新しいものを取りに行き、だめなら控えを出す
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put('./index.html', copy))
          return response
        })
        .catch(() => caches.match('./index.html').then((r) => r ?? caches.match('./'))),
    )
    return
  }

  // 部品（JS・CSS・画像）：控えをすぐ出して、裏で新しいものに差し替える
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => cached)

      return cached ?? network
    }),
  )
})

/* 通知をタップしたらアプリを前に出す */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus()
      }
      return self.clients.openWindow('./')
    }),
  )
})
