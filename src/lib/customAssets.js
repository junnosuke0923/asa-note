/*
 * 差し替えできる絵と ことば。
 *
 * 考えかたを2つに分けている。
 *
 *  ① お祝いのセット … 「この絵には この ことば」の組。
 *     記録できたときに、組のまま出る。
 *     いくつ作ってもよい。作った数だけ ランダムに出る。
 *     4つのグループに分かれていて、その日のようすで選ばれる。
 *
 *  ② 画面のかざり … 各ページの すみに出る絵。
 *     こちらは1画面につき1枚で、ことばは付かない。
 *
 * 絵は文字（データURL）にして IndexedDB へ入れる。
 * 大きい写真をそのまま入れると重くなるので、
 * 取り込むときに縦横 512px に収まるよう縮める。
 */

import { idbDelete, idbGet, idbGetAll, idbSet, STORE_IMAGES, STORE_SETS } from './idb'
import { cheerMessages } from '../data/cheerMessages'

/* ── ① お祝いのセット ───────────────────────────────────── */

export const CHEER_GROUPS = [
  { id: 'normal', label: 'いつでも', hint: 'ふだんの記録のとき' },
  { id: 'tough', label: 'つらい朝', hint: 'しんどそうなときに出す' },
  { id: 'streak', label: 'つづいてる', hint: '3日以上つづいたとき' },
  { id: 'comeback', label: 'ひさしぶり', hint: '間があいて戻ってきたとき' },
]

const SETS_KEY = 'cheer-sets'

/** はじめから入っているセット。絵はまだ無く、ことばだけ */
export function defaultCheerSets() {
  return cheerMessages.map((m) => ({ category: m.category, text: m.text, image: null }))
}

function normalizeSet(raw) {
  if (!raw || typeof raw !== 'object') return null
  if (typeof raw.text !== 'string') return null
  if (!CHEER_GROUPS.some((g) => g.id === raw.category)) return null

  return {
    category: raw.category,
    text: raw.text,
    image:
      typeof raw.image === 'string' && raw.image.startsWith('data:image/') ? raw.image : null,
  }
}

export function normalizeCheerSets(raw) {
  if (!Array.isArray(raw)) return null
  const cleaned = raw.map(normalizeSet).filter(Boolean)
  return cleaned.length > 0 ? cleaned : null
}

export async function loadCheerSets() {
  return normalizeCheerSets(await idbGet(STORE_SETS, SETS_KEY))
}

export function saveCheerSets(sets) {
  return idbSet(STORE_SETS, SETS_KEY, sets)
}

export function clearCheerSets() {
  return idbDelete(STORE_SETS, SETS_KEY)
}

/* ── ② 画面のかざり ─────────────────────────────────────── */

export const DECORATION_SLOTS = [
  { id: 'record', label: '記録がめん', hint: '毎朝いちばんに出てくる絵' },
  { id: 'calendar', label: 'こよみ', hint: 'カレンダーの上に出る絵' },
  { id: 'chart', label: 'グラフ', hint: 'グラフの見出しに出る絵' },
  { id: 'badge', label: '検定の賞状', hint: '賞状のまんなか（草のかわり）' },
  { id: 'empty', label: 'グラフが空のとき', hint: 'まだ記録がないときの絵' },
  { id: 'settings', label: 'せってい', hint: '設定の見出しに出る絵' },
  { id: 'subjugation', label: '討伐のカード', hint: '「討伐した日」の横に出る絵' },
]

export async function loadDecorations() {
  const all = await idbGetAll(STORE_IMAGES)
  const valid = {}
  for (const slot of DECORATION_SLOTS) {
    if (typeof all[slot.id] === 'string' && all[slot.id].startsWith('data:image/')) {
      valid[slot.id] = all[slot.id]
    }
  }
  return valid
}

export function saveDecoration(slotId, dataUrl) {
  return idbSet(STORE_IMAGES, slotId, dataUrl)
}

export function removeDecoration(slotId) {
  return idbDelete(STORE_IMAGES, slotId)
}

/* ── 画像の取り込み ─────────────────────────────────────── */

const MAX_PIXELS = 512
const MAX_FILE_BYTES = 12 * 1024 * 1024

/** 選ばれたファイルを、小さくしてデータURLにする */
export async function fileToImageData(file) {
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: '画像ファイルを えらんでください。' }
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: 'ファイルが大きすぎます（12MBまで）。' }
  }

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_PIXELS / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()

    // 透過を残したいので PNG のまま
    return { ok: true, dataUrl: canvas.toDataURL('image/png'), width, height }
  } catch {
    return { ok: false, error: 'この画像は読みこめませんでした。' }
  }
}
