/*
 * パートナーへの共有。
 *
 * 送り先の入り口は3つ用意する。端末によって使えるものが違うため。
 *   ・LINE で送る … LINEの「テキストを送る」画面をひらく
 *   ・ほかのアプリ … 端末の共有メニュー（LINE以外も選べる）
 *   ・コピー      … どれも使えないときの逃げ道
 *
 * 送るのは文字だけ。アプリから外部へデータを送信する処理は一切していない
 * （LINEに渡したあと、何を送るかは本人が確認して決める）。
 */

import { getCurrentCycleDay } from './cycle'
import { formatLong } from './dateUtils'
import { calcPhaseInfo } from './temperature'

/** LINEに貼りつける文面を組み立てる */
export function buildShareText(records, dateKey, cheerMessage) {
  const record = records[dateKey]
  const lines = [`${formatLong(dateKey)}の基礎体温`, '']

  if (record?.temperature != null) {
    const phase = calcPhaseInfo(records, dateKey)
    const phaseText = phase ? `　${phase.high ? '高温期' : '低温期'} ${phase.days}日目` : ''
    lines.push(`${record.temperature.toFixed(2)}℃${phaseText}`)
  } else {
    lines.push('（まだ測っていません）')
  }

  const cycle = getCurrentCycleDay(records, dateKey)
  if (cycle) lines.push(`周期 ${cycle.day}日目`)
  if (record?.period) lines.push('生理きてる')

  lines.push('', cheerMessage ?? 'なんとかなれーッ！！')

  return lines.join('\n')
}

/** LINEの送信画面をひらくURL */
export function lineShareUrl(text) {
  return `https://line.me/R/msg/text/?${encodeURIComponent(text)}`
}

/** 端末の共有メニュー。使えない端末もある */
export function isNativeShareSupported() {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

export async function shareNative(text) {
  if (!isNativeShareSupported()) return { ok: false, code: 'unsupported' }

  try {
    await navigator.share({ text })
    return { ok: true }
  } catch (error) {
    // 共有シートを閉じただけ
    if (error?.name === 'AbortError') return { ok: false, code: 'cancelled' }
    return { ok: false, code: 'failed' }
  }
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return { ok: true }
  } catch {
    return { ok: false, code: 'failed' }
  }
}
