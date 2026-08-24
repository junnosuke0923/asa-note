/*
 * 「もう何か月か使ってみた状態」のアプリを作る。
 *
 * ふつうのアプリと同じものに、開いた時点で記録が入っているだけ。
 * 触って確かめるためのもの。
 *
 * 大事な点：保存する場所の名前をぜんぶ変えてある。
 * こうしないと、同じブラウザで本物のアプリを開いたときに
 * デモの記録と混ざってしまう。
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'dist-artifact', 'index.html')
const target = join(root, 'dist-artifact', 'demo.html')

let html = readFileSync(source, 'utf8')

// 保存場所の名前を変える（LocalStorage のキーも IndexedDB の名前もこれで変わる）
const before = (html.match(/kiso-taion/g) ?? []).length
html = html.replaceAll('kiso-taion', 'kiso-taion-demo')
console.log(`保存場所の名前を ${before} 箇所 差し替えました`)

/*
 * 開いた時点で入っている記録。
 * 日付は「開いた日」から数えるので、いつ開いても
 * 「ついさっきまで続けていた」状態に見える。
 */
const seed = `
<script>
/*
 * 保存領域が使えない場所への備え。
 *
 * 埋めこみ表示やプライベートモードでは localStorage が使えないことがある。
 * そのままだと デモの記録が1件も入らず、空のアプリが出てしまう。
 * 使えないときだけ、その場かぎりの入れ物にすり替えておく。
 */
(function () {
  var usable = false
  try {
    localStorage.setItem('__probe__', '1')
    localStorage.removeItem('__probe__')
    usable = true
  } catch (e) {}
  if (usable) return

  var mem = Object.create(null)
  var fake = {
    getItem: function (k) { return k in mem ? mem[k] : null },
    setItem: function (k, v) { mem[k] = String(v) },
    removeItem: function (k) { delete mem[k] },
    clear: function () { mem = Object.create(null) },
    key: function (i) { return Object.keys(mem)[i] || null },
  }
  Object.defineProperty(fake, 'length', { get: function () { return Object.keys(mem).length } })
  try {
    Object.defineProperty(window, 'localStorage', { value: fake, configurable: true })
  } catch (e) {}
})()
</script>

<script>
(function () {
  var RECORDS = 'kiso-taion-demo:records:v2'
  var TREATMENTS = 'kiso-taion-demo:treatments:v1'
  var SETTINGS = 'kiso-taion-demo:settings:v1'
  var STAMP = 'kiso-taion-demo:seeded'
  // 中身を変えたら ここを上げる。古いデモが残ったままにならないように
  var SEED_VERSION = 'v8'

  // 一度作ったら、あとは触らない（自分で編集した内容が消えないように）
  try { if (localStorage.getItem(STAMP) === SEED_VERSION) return } catch (e) { return }

  // 同じ見た目になるよう、でたらめの出しかたを固定しておく
  var s = 20260824
  function rnd() { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 }

  function key(daysAgo) {
    var d = new Date()
    d.setDate(d.getDate() - daysAgo)
    var p = function (n) { return String(n).padStart(2, '0') }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
  }

  // 月経の始まり（何日前か）と、その周期の長さ
  var CYCLES = [
    { start: 105, length: 29 },
    { start: 76, length: 28 },
    { start: 48, length: 28 },
    { start: 20, length: null }, // いまの周期。まだ終わっていない
  ]

  function cycleOf(daysAgo) {
    for (var i = CYCLES.length - 1; i >= 0; i--) {
      if (daysAgo <= CYCLES[i].start) {
        return { day: CYCLES[i].start - daysAgo, length: CYCLES[i].length || 30 }
      }
    }
    return null
  }

  var records = {}
  var treatments = {}

  for (var ago = 105; ago >= 0; ago--) {
    var c = cycleOf(ago)
    if (!c) continue

    /*
     * きょうだけ わざと空けてある。
     * 昨日までで ちょうど79日ぶんになるので、
     * きょう記録すると80日になり「2級 合格」の賞状が出る。
     * ポップアップの出かたを その場で確かめられるようにするため。
     */
    if (ago === 0) continue

    // ここで一度 途切れさせて、いまの連続を ちょうど59日にする
    if (ago === 60) continue

    // 使いはじめの頃は、ときどきつけ忘れている
    if (ago > 60 && (ago % 9 === 0 || ago % 13 === 0)) continue

    var dayInCycle = c.day
    var isPeriod = dayInCycle < 5
    var highFrom = c.length - 14
    var isHigh = dayInCycle >= highFrom

    var base = isHigh ? 36.76 : 36.31
    var temp = base + (rnd() * 0.12 - 0.05)

    // 排卵のころに いったん下がる日
    if (dayInCycle === highFrom - 1) temp -= 0.09

    var hour = 6
    var minute = 35 + Math.floor(rnd() * 28)
    var memo = ''
    // たまに寝坊した日。時刻がずれると体温も上がりやすい
    if (ago === 12 || ago === 47) { hour = 7; minute = 52; temp += 0.14; memo = 'ねぼうした' }
    if (ago === 30) memo = 'ねむれなかった'
    if (ago === 5) memo = 'すこし さむけ'
    if (minute >= 60) { hour += 1; minute -= 60 }

    var tags = []
    if (dayInCycle >= 3 && dayInCycle <= 9 && ago < 80) tags.push('medicine')
    if (ago === 3 || ago === 18 || ago === 31 || ago === 45 || ago === 59) tags.push('hospital')
    /*
     * しんどかった日は、体温もはっきり上がるようにしておく。
     * グラフの点線の丸が「この山は体のリズムではないかも」を
     * 示すためのものなので、山が無いと意味が伝わらない
     */
    if (ago === 5 || ago === 33) { tags.push('unwell'); temp += 0.36 }

    records[key(ago)] = {
      temperature: Math.round(temp * 100) / 100,
      time: String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0'),
      tags: tags,
      period: isPeriod,
      flow: isPeriod ? (dayInCycle < 2 ? 'heavy' : dayInCycle < 4 ? 'medium' : 'light') : null,
      intimacy: dayInCycle === highFrom - 2 || dayInCycle === highFrom,
      weight: ago % 6 === 0 ? Math.round((52.1 + rnd() * 0.8) * 10) / 10 : null,
      memo: memo,
    }
  }

  /*
   * 級は「のべ日数」で決まるので、あと1日で級が上がる位置に揃えておく。
   * 79日 → きょう記録すると80日で「2級 合格」。
   * 古い日から間引く（いまの周期の形は そのまま残る）。
   */
  var keys = Object.keys(records).sort()
  while (keys.length > 79) { delete records[keys.shift()] }

  // 通院の記録
  var VISITS = [
    { ago: 59, content: '卵胞チェック', meds: 'クロミッド 1錠', inj: '', e2: 118, fol: 12.4, endo: 7.2, cost: 4400 },
    { ago: 45, content: '卵胞チェック・注射', meds: 'クロミッド 1錠', inj: 'hMG 150単位', e2: 246, fol: 17.8, endo: 8.6, cost: 8800 },
    { ago: 31, content: '排卵確認', meds: '', inj: '', e2: 92, fol: null, endo: 9.1, cost: 3300 },
    { ago: 18, content: '採卵', meds: 'ルトラール', inj: 'hCG 5000単位', e2: 1840, fol: 19.2, endo: 10.4, cost: 132000 },
    { ago: 3, content: '移植', meds: 'ルティナス', inj: '', e2: 310, fol: null, endo: 11.2, cost: 96000 },
  ]
  VISITS.forEach(function (v) {
    treatments[key(v.ago)] = {
      visited: true,
      clinic: 'さくら レディースクリニック',
      content: v.content,
      meds: v.meds,
      injection: v.inj,
      hormones: { e2: v.e2, lh: null, fsh: null, p4: null },
      follicleL: v.fol,
      follicleR: null,
      endometrium: v.endo,
      cost: v.cost,
      memo: v.ago === 3 ? 'つぎは 10日後に判定' : '',
    }
  })

  try {
    localStorage.setItem(RECORDS, JSON.stringify(records))
    localStorage.setItem(TREATMENTS, JSON.stringify(treatments))
    localStorage.setItem(SETTINGS, JSON.stringify({
      reminderEnabled: false, reminderTime: '07:00', folderAutoSave: false, theme: 'light',
    }))
    localStorage.setItem(STAMP, SEED_VERSION)
  } catch (e) {}
})()
</script>

<script>
/*
 * デモを最初の状態に戻すボタン。
 * 何度でも お祝いや賞状の出かたを見られるようにするため。
 * デモ専用で、アプリ本体には入らない。
 */
window.addEventListener('load', function () {
  // 何をすれば賞状が出るのか、画面に書いておく
  var hint = document.createElement('div')
  hint.innerHTML =
    '<b>デモ</b>：いま <b>のべ79日</b>。' +
    '「きろく する！」を押すと 80日になり、' +
    '<b>検定〈2級 合格〉の賞状</b>が出ます。'
  hint.style.cssText = [
    'position:fixed', 'left:12px', 'bottom:12px', 'z-index:99999',
    'max-width:260px', 'font:700 11px/1.6 system-ui,sans-serif',
    'padding:10px 12px', 'border:2.5px solid #5A4A3F', 'border-radius:16px',
    'background:#FFFDF5', 'color:#5A4A3F',
    'box-shadow:3px 4px 0 rgba(90,74,63,.25)',
  ].join(';')
  document.body.appendChild(hint)

  var b = document.createElement('button')
  b.type = 'button'
  b.textContent = 'デモを 最初から'
  b.style.cssText = [
    'position:fixed', 'right:12px', 'bottom:12px', 'z-index:99999',
    'font:700 12px/1 system-ui,sans-serif', 'padding:9px 13px',
    'border:2.5px solid #5A4A3F', 'border-radius:999px',
    'background:#FFE49C', 'color:#5A4A3F', 'cursor:pointer',
    'box-shadow:3px 4px 0 rgba(90,74,63,.25)',
  ].join(';')
  b.onclick = function () {
    try {
      // key() で回す。すり替えた入れ物でも同じように消せるようにするため
      var keys = []
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i)
        if (k && k.indexOf('kiso-taion-demo') === 0) keys.push(k)
      }
      keys.forEach(function (k) { localStorage.removeItem(k) })
    } catch (e) {}
    try { indexedDB.deleteDatabase('kiso-taion-demo') } catch (e) {}
    location.reload()
  }
  document.body.appendChild(b)
})
</script>
`

// アプリ本体より先に動かしたいので、module のスクリプトの前に差しこむ
const at = html.indexOf('<script type="module">')
if (at < 0) {
  console.error('アプリのスクリプトが見つかりません')
  process.exit(1)
}
html = html.slice(0, at) + seed + html.slice(at)

html = html.replace('<title>ちいかわ風 基礎体温記録</title>', '<title>きそたいおん デモ</title>')

writeFileSync(target, html, 'utf8')
console.log(`書き出しました: ${target}`)
console.log(`  合計 ${(html.length / 1024).toFixed(1)} kB`)
