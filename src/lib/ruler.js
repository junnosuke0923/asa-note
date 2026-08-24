/*
 * 目盛り入力の「位置」と「体温」の変換。
 *
 * この2つが食い違うと、なぞっても値が決まらなかったり、
 * 勝手に動き続けたりする。取り違えやすいのでここだけ切り出してある。
 */

export const MIN_CENTS = 3500 // 35.00℃
export const MAX_CENTS = 3850 // 38.50℃
export const STEP_PX = 9 // 0.01℃ あたりの幅。指で狙える太さにしてある

export const clampCents = (cents) => Math.min(MAX_CENTS, Math.max(MIN_CENTS, cents))

/** スクロール位置 → 体温（℃） */
export function scrollToTemperature(scrollLeft) {
  return clampCents(MIN_CENTS + Math.round(scrollLeft / STEP_PX)) / 100
}

/** 体温（℃） → スクロール位置 */
export function temperatureToScroll(temperature) {
  return (clampCents(Math.round(temperature * 100)) - MIN_CENTS) * STEP_PX
}
