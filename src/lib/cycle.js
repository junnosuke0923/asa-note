/*
 * 生理周期の計算。
 *
 * ここで出す数字は、あくまで「これまでの記録の平均」から引いた目安。
 * 医学的な判定ではないので、画面にもそう書いておくこと。
 * 不妊治療中は医師の指示が優先される。
 */

import { shiftKey, todayKey } from './dateUtils'

/** 高温期と判定するときの、低温期平均からの上がり幅（℃） */
const PHASE_GAP = 0.3

/** 高温期に入ったとみなすのに必要な連続日数 */
const PHASE_RUN = 3

/** 周期として扱う日数の範囲。極端な値は平均から外す */
const MIN_CYCLE_DAYS = 15
const MAX_CYCLE_DAYS = 60

/** この日数以内に月経日が続いていれば、同じ月経の続きとみなす（記録漏れ対策） */
const PERIOD_MERGE_WINDOW = 10

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** 日付キーの差（日数） */
export function daysBetween(fromKey, toKey) {
  const from = new Date(`${fromKey}T00:00:00`)
  const to = new Date(`${toKey}T00:00:00`)
  return Math.round((to - from) / MS_PER_DAY)
}

function average(numbers) {
  if (numbers.length === 0) return null
  return numbers.reduce((a, b) => a + b, 0) / numbers.length
}

/**
 * 月経の開始日を拾う。
 *
 * 開始日を別項目で持たせると、連続していない開始日が並ぶなど
 * 矛盾したデータが作れてしまうため、記録から導く形にしている。
 *
 * 「前日が月経中でなければ開始」とすると、月経中に1日つけ忘れただけで
 * そこが新しい月経の始まりになってしまう。実際には記録漏れは普通に起きるので、
 * 直前の月経日から PERIOD_MERGE_WINDOW 日以内なら同じ月経の続きとみなす。
 * 周期は最短でも15日あるため、これで別の周期を取り違えることはない。
 */
export function getPeriodStarts(records) {
  const periodDays = Object.keys(records)
    .filter((key) => records[key]?.period)
    .sort()

  const starts = []
  let previous = null

  for (const key of periodDays) {
    if (previous === null || daysBetween(previous, key) > PERIOD_MERGE_WINDOW) {
      starts.push(key)
    }
    previous = key
  }

  return starts
}

/**
 * 周期の一覧。
 * 各周期は「月経開始日から、次の月経開始日の前日まで」。
 * 最後の周期はまだ終わっていないので length を null にする。
 */
export function getCycles(records) {
  const starts = getPeriodStarts(records)

  return starts.map((start, i) => {
    const nextStart = starts[i + 1]
    return {
      start,
      end: nextStart ? shiftKey(nextStart, -1) : null,
      length: nextStart ? daysBetween(start, nextStart) : null,
    }
  })
}

/** 平均周期日数。極端な値は除いてから平均する */
export function getAverageCycleLength(records) {
  const lengths = getCycles(records)
    .map((cycle) => cycle.length)
    .filter((len) => len !== null && len >= MIN_CYCLE_DAYS && len <= MAX_CYCLE_DAYS)

  if (lengths.length === 0) return null
  return Math.round(average(lengths))
}

/** いま何周期目の何日目か */
export function getCurrentCycleDay(records, baseKey = todayKey()) {
  const starts = getPeriodStarts(records)
  if (starts.length === 0) return null

  const currentStart = [...starts].reverse().find((start) => start <= baseKey)
  if (!currentStart) return null

  return { start: currentStart, day: daysBetween(currentStart, baseKey) + 1 }
}

/**
 * ひとつの周期の中で、低温期と高温期の境目を探す。
 *
 * やり方：前半を低温期の候補として平均を取り、
 * そこから PHASE_GAP 以上高い日が PHASE_RUN 日つづいた最初の地点を境目とする。
 * 一定値（36.7℃など）で切ると個人差を吸収できないため、
 * その人自身の低温期平均を基準にしている。
 *
 * @returns {{ shiftKey: string, lowAvg: number, highAvg: number, highDays: number } | null}
 */
export function detectPhaseShift(temps) {
  // temps: [{ key, temperature }] を日付順で
  if (temps.length < PHASE_RUN + 3) return null

  for (let i = 3; i <= temps.length - PHASE_RUN; i += 1) {
    const lowAvg = average(temps.slice(0, i).map((t) => t.temperature))
    if (lowAvg === null) continue

    const run = temps.slice(i, i + PHASE_RUN)
    const allHigh = run.every((t) => t.temperature >= lowAvg + PHASE_GAP)

    if (allHigh) {
      const highTemps = temps.slice(i).map((t) => t.temperature)
      return {
        shiftKey: temps[i].key,
        lowAvg,
        highAvg: average(highTemps),
        highDays: highTemps.length,
      }
    }
  }

  return null
}

/** 周期ごとの、低温期→高温期の切り替わりと高温期の長さ */
export function getCyclePhases(records) {
  return getCycles(records).map((cycle) => {
    const endKey = cycle.end ?? todayKey()

    const temps = Object.keys(records)
      .filter((key) => key >= cycle.start && key <= endKey)
      .filter((key) => records[key].temperature !== null)
      .sort()
      .map((key) => ({ key, temperature: records[key].temperature }))

    return { ...cycle, phase: detectPhaseShift(temps) }
  })
}

/** 高温期の平均日数。排卵から次の月経までの目安になる */
export function getAverageHighPhaseDays(records) {
  const completed = getCyclePhases(records).filter((c) => c.length !== null && c.phase)
  if (completed.length === 0) return null

  const days = completed.map((c) => daysBetween(c.phase.shiftKey, c.end) + 1)
  return Math.round(average(days))
}

/**
 * 次の月経・排卵の目安。
 *
 * あくまで平均から引いた予測なので、画面では「目安」と明示すること。
 */
export function getPredictions(records, baseKey = todayKey()) {
  const avgCycle = getAverageCycleLength(records)
  const current = getCurrentCycleDay(records, baseKey)

  if (!avgCycle || !current) return null

  const nextPeriod = shiftKey(current.start, avgCycle)
  const highDays = getAverageHighPhaseDays(records) ?? 14
  const ovulation = shiftKey(nextPeriod, -highDays)

  return {
    nextPeriod,
    ovulation,
    daysToNextPeriod: daysBetween(baseKey, nextPeriod),
    daysToOvulation: daysBetween(baseKey, ovulation),
    basedOnCycles: getCycles(records).filter((c) => c.length !== null).length,
  }
}

/** 画面に出すまとめ */
export function getCycleStats(records) {
  const cycles = getCycles(records)
  const completed = cycles.filter((c) => c.length !== null)

  return {
    cycleCount: cycles.length,
    averageCycleLength: getAverageCycleLength(records),
    averageHighPhaseDays: getAverageHighPhaseDays(records),
    shortest: completed.length ? Math.min(...completed.map((c) => c.length)) : null,
    longest: completed.length ? Math.max(...completed.map((c) => c.length)) : null,
    current: getCurrentCycleDay(records),
    predictions: getPredictions(records),
  }
}
