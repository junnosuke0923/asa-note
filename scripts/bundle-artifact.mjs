/*
 * ビルド結果を1枚のHTMLにまとめる。
 *
 * Artifact として公開するページは外部ファイルを読み込めないため、
 * dist/ の JS と CSS を本文に埋め込んで自己完結させる。
 * Google Fonts だけは読み込みが許されているので、そのまま残す。
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const assets = join(dist, 'assets')

const files = readdirSync(assets)
const jsFile = files.find((f) => f.endsWith('.js'))
const cssFile = files.find((f) => f.endsWith('.css'))

if (!jsFile || !cssFile) {
  console.error('dist/assets に JS/CSS が見つかりません。先に npm run build を実行してください。')
  process.exit(1)
}

const js = readFileSync(join(assets, jsFile), 'utf8')
const css = readFileSync(join(assets, cssFile), 'utf8')

// スクリプト内に </script> があると、そこでタグが閉じてしまう
const safeJs = js.replaceAll('</script', '<\\/script')

const html = `<title>ちいかわ風 基礎体温記録</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Yomogi&family=Zen+Maru+Gothic:wght@400;700;900&display=swap"
  rel="stylesheet"
/>
<style>
${css}
</style>
<div id="root"></div>
<script type="module">
${safeJs}
</script>
`

mkdirSync(join(root, 'dist-artifact'), { recursive: true })
const out = join(root, 'dist-artifact', 'index.html')
writeFileSync(out, html, 'utf8')

console.log(`書き出しました: ${out}`)
console.log(`  JS  ${(js.length / 1024).toFixed(1)} kB`)
console.log(`  CSS ${(css.length / 1024).toFixed(1)} kB`)
console.log(`  合計 ${(html.length / 1024).toFixed(1)} kB`)
