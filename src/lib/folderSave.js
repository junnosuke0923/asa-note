/*
 * 保存先フォルダを覚えて、そこへ直接書き出す。
 *
 * ねらいは「Googleドライブに直接保存」。
 * ただしアプリがGoogleに直接つなぐのではなく、
 * パソコンに同期されているドライブのフォルダへ普通のファイルとして書き込む。
 * あとは同期ソフトがクラウドへ上げてくれる。
 *
 * この方法なら
 *   ・APIキーやログインの設定がいらない（誰かに渡すときも設定不要）
 *   ・アプリは外部と通信しない（体温データをどこにも送らない約束を守れる）
 *   ・Googleドライブでも OneDrive でも Dropbox でも、同期フォルダなら何でもよい
 *
 * フォルダの「鍵」（ハンドル）はブラウザの IndexedDB に預ける。
 * これは JSON にできないので localStorage には入れられない。
 */

import { idbDelete, idbGet, idbSet, STORE_HANDLES } from './idb'

const KEY = 'backup-folder'

export function isFolderSaveSupported() {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'
}

/*
 * 開いている間はここにも持っておく。
 * プライベートモードなどで IndexedDB に書けなくても、
 * 少なくともそのセッション中は保存できるようにするため。
 */
let memoryHandle = null

async function readHandle() {
  if (memoryHandle) return memoryHandle
  memoryHandle = await idbGet(STORE_HANDLES, KEY)
  return memoryHandle
}

async function writeHandle(handle) {
  memoryHandle = handle
  await idbSet(STORE_HANDLES, KEY, handle)
}

async function clearHandle() {
  memoryHandle = null
  await idbDelete(STORE_HANDLES, KEY)
}

/** 書き込みの許可があるか確認する。無ければ聞く */
async function ensurePermission(handle, ask) {
  if (!handle?.queryPermission) return true

  const options = { mode: 'readwrite' }
  if ((await handle.queryPermission(options)) === 'granted') return true
  if (!ask) return false

  return (await handle.requestPermission(options)) === 'granted'
}

/**
 * 覚えているフォルダを取り出す。
 * ブラウザを開き直した直後は許可が切れていることがあるので、
 * ここでは聞かずに「名前だけ」返す用途に使う。
 */
export async function getRememberedFolder() {
  const handle = await readHandle()
  if (!handle) return null

  const granted = await ensurePermission(handle, false)
  return { handle, name: handle.name, granted }
}

/** フォルダを選んでもらって覚える */
export async function pickFolder() {
  try {
    const handle = await window.showDirectoryPicker({
      id: 'kiso-taion-backup',
      mode: 'readwrite',
      startIn: 'documents',
    })

    if (!(await ensurePermission(handle, true))) {
      return { ok: false, code: 'denied' }
    }

    await writeHandle(handle)
    return { ok: true, name: handle.name }
  } catch (error) {
    // ダイアログを閉じただけ
    if (error?.name === 'AbortError') return { ok: false, code: 'cancelled' }
    return { ok: false, code: 'failed' }
  }
}

export async function forgetFolder() {
  await clearHandle()
}

/** 覚えているフォルダへ書き込む */
export async function saveToFolder(filename, text, { ask = true } = {}) {
  const handle = await readHandle()
  if (!handle) return { ok: false, code: 'no-folder' }

  if (!(await ensurePermission(handle, ask))) {
    return { ok: false, code: 'denied' }
  }

  try {
    const fileHandle = await handle.getFileHandle(filename, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(text)
    await writable.close()
    return { ok: true, name: handle.name, filename }
  } catch {
    return { ok: false, code: 'failed' }
  }
}

export function describeFolderError(code) {
  switch (code) {
    case 'no-folder':
      return 'さきに 保存先のフォルダを えらんでください。'
    case 'denied':
      return 'フォルダへの書き込みが 許可されませんでした。'
    case 'cancelled':
      return ''
    default:
      return 'フォルダに保存できませんでした。'
  }
}
