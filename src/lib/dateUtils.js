/*
 * 日付の扱い。
 *
 * 保存のキーは "2026-08-23" という文字列にしている。
 * toISOString() を使うと世界標準時に変換されてしまい、朝5時の記録が
 * 前日扱いになることがあるため、あえて自前で組み立てている。
 */

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

/** Date → "YYYY-MM-DD" */
export function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** "YYYY-MM-DD" → Date（その日の0時） */
export function fromDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayKey() {
  return toDateKey(new Date())
}

/** キーを指定日数ずらす。月またぎ・年またぎもDateに任せるので安全 */
export function shiftKey(key, deltaDays) {
  const date = fromDateKey(key)
  date.setDate(date.getDate() + deltaDays)
  return toDateKey(date)
}

/** "8月23日（日）" */
export function formatLong(key) {
  const date = fromDateKey(key)
  return `${date.getMonth() + 1}月${date.getDate()}日（${WEEKDAY_LABELS[date.getDay()]}）`
}

/** "8/23" — グラフの目盛り用 */
export function formatShort(key) {
  const date = fromDateKey(key)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

export const WEEKDAYS = WEEKDAY_LABELS

/** "2026年8月" */
export function formatMonth(year, month) {
  return `${year}年${month}月`
}

/** その月を1か月ずらす。12月→1月のまたぎもここで吸収する */
export function shiftMonth(year, month, delta) {
  const date = new Date(year, month - 1 + delta, 1)
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}

/**
 * カレンダーの升目を作る。
 * 日曜はじまりで、月の前後の空きは null で埋めて7の倍数に揃える。
 */
export function buildMonthGrid(year, month) {
  const firstWeekday = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  const cells = Array(firstWeekday).fill(null)
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(toDateKey(new Date(year, month - 1, day)))
  }
  while (cells.length % 7 !== 0) cells.push(null)

  return cells
}

/** キーから「日」だけ取り出す */
export function dayOfKey(key) {
  return Number(key.slice(8, 10))
}

/*
 * 「記録した日」とは、体温を measured した日のこと。
 *
 * 生理だけ付けた日やメモだけの日は数えない。
 * 草むしり検定は「毎朝ちゃんと測った」ことを称えるものなので、
 * 測っていない日で級が上がってしまうと意味がなくなる。
 */
const measured = (record) => record != null && record.temperature != null

/**
 * 連続記録の日数を数える。
 *
 * 今日まだ記録していなくても、昨日まで続いていれば連続は途切れていない扱いにする。
 * 朝の記録前にアプリを開いたときに「0日」と出てしまうのを防ぐため。
 */
export function calcStreak(records, baseKey = todayKey()) {
  let cursor = measured(records[baseKey]) ? baseKey : shiftKey(baseKey, -1)
  let count = 0

  while (measured(records[cursor])) {
    count += 1
    cursor = shiftKey(cursor, -1)
  }

  return count
}

/**
 * これまでで いちばん長く続いた日数。
 * 治療中は記録が途切れる時期があるので、
 * 「いまの連続」が0でも過去の頑張りが消えないように別で持っておく。
 */
export function calcBestStreak(records) {
  const keys = Object.keys(records)
    .filter((key) => measured(records[key]))
    .sort()
  if (keys.length === 0) return 0

  let best = 1
  let run = 1

  for (let i = 1; i < keys.length; i += 1) {
    run = shiftKey(keys[i - 1], 1) === keys[i] ? run + 1 : 1
    if (run > best) best = run
  }

  return best
}
