import { shiftKey, todayKey } from './dateUtils'

/** 高温期と低温期の境目。指示書の指定どおり36.7℃ */
export const HIGH_TEMP_THRESHOLD = 36.7

export function isHighPhase(temperature) {
  return temperature >= HIGH_TEMP_THRESHOLD
}

/** これ以上ちがったら、打ちまちがいを疑って一度だけ聞く */
const SUSPICIOUS_GAP = 0.5

/**
 * 打ちまちがいらしき値か。
 *
 * 36.5 を 37.5 と打っても、いまは黙って記録されてしまう。
 * グラフが1点だけ跳ねて、あとで見返したときに理由が分からなくなる。
 *
 * 直前の記録と大きく離れているときだけ確認する。
 * 毎回聞くと ただの邪魔になるため。
 *
 * @returns {{ previous: number, previousKey: string, gap: number } | null}
 */
export function findSuspiciousJump(records, dateKey, temperature) {
  if (typeof temperature !== 'number') return null

  // その日より前で、いちばん近い記録をさがす
  const previousKey = Object.keys(records)
    .filter((key) => key < dateKey && records[key]?.temperature != null)
    .sort()
    .pop()

  if (!previousKey) return null

  const previous = records[previousKey].temperature
  const gap = Math.abs(temperature - previous)

  return gap >= SUSPICIOUS_GAP ? { previous, previousKey, gap } : null
}

/**
 * いま高温期か低温期か、そして何日目かを求める。
 * フェーズ3のLINE共有（「高温期5日目！」）でもこの値を使う。
 *
 * 記録が無い日で数えるのをやめる。飛び飛びの記録から
 * 「本当は続いていたはず」と推測するのは危ないため。
 */
export function calcPhaseInfo(records, baseKey = todayKey()) {
  // 体温が入っている日だけを見る。月経やメモだけの日は数えない
  const hasTemp = (key) =>
    records[key] !== undefined &&
    records[key].temperature !== null &&
    records[key].temperature !== undefined

  // 直近の記録日まで遡る（最大1年ぶん）
  let cursor = baseKey
  for (let i = 0; i < 366 && !hasTemp(cursor); i += 1) {
    cursor = shiftKey(cursor, -1)
  }
  if (!hasTemp(cursor)) return null

  const high = isHighPhase(records[cursor].temperature)
  const latestKey = cursor
  let days = 0

  while (hasTemp(cursor) && isHighPhase(records[cursor].temperature) === high) {
    days += 1
    cursor = shiftKey(cursor, -1)
  }

  return { high, days, latestKey }
}
