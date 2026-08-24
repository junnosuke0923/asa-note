/*
 * 記録の保存を、ここ一箇所にまとめる。
 *
 * ブラウザの保存領域は、いつでも使えるとは限らない。
 *   ・プライベートモード
 *   ・埋めこみ表示（別のページの中で開いているとき）
 *   ・容量がいっぱいになったとき
 *
 * これまでは「保存できなくても画面は動かし続ける」だけだった。
 * つまり、記録しても実際には残っていないのに、
 * 本人は残ったつもりでいる、という状態が起こりうる。
 * 数か月ぶんの基礎体温では、これがいちばん困る。
 *
 * そこで
 *   ・書けなかったことを覚えておき、画面に出せるようにする
 *   ・そのあいだも、開いている間だけの入れ物に控えて、
 *     少なくともアプリを閉じるまでは ふつうに使えるようにする
 */

const PROBE_KEY = '__kiso_probe__'

/** その場かぎりの控え。保存領域が使えないときの受け皿 */
const memory = new Map()

let available = null
const listeners = new Set()

function notify() {
  for (const fn of listeners) fn(available)
}

function setAvailable(next) {
  if (available === next) return
  available = next
  notify()
}

function probe() {
  try {
    localStorage.setItem(PROBE_KEY, '1')
    localStorage.removeItem(PROBE_KEY)
    return true
  } catch {
    return false
  }
}

/** 保存領域がいま使えるか */
export function isStorageAvailable() {
  if (available === null) available = probe()
  return available
}

/** 使える／使えないが変わったときに知らせる */
export function onStorageChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function readText(key) {
  if (isStorageAvailable()) {
    try {
      const value = localStorage.getItem(key)
      if (value !== null) return value
    } catch {
      setAvailable(false)
    }
  }
  return memory.has(key) ? memory.get(key) : null
}

/**
 * 書き込む。
 * @returns {boolean} ほんとうに保存領域へ残せたか
 */
export function writeText(key, value) {
  // 保存領域が使えなくても、開いている間は使えるように必ず控える
  memory.set(key, value)

  if (!isStorageAvailable()) return false

  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    // 容量オーバーなど、途中から書けなくなることもある
    setAvailable(false)
    return false
  }
}

export function removeText(key) {
  memory.delete(key)
  if (!isStorageAvailable()) return

  try {
    localStorage.removeItem(key)
  } catch {
    setAvailable(false)
  }
}

/** JSONとして読む。壊れていたら null */
export function readJson(key) {
  const raw = readText(key)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function writeJson(key, value) {
  return writeText(key, JSON.stringify(value))
}
