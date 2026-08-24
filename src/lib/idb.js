/*
 * ブラウザの中の保管庫（IndexedDB）を使うための小さな道具。
 *
 * LocalStorage は文字しか入らず、容量も小さい。
 * 画像や、フォルダの「鍵」のように文字にできないものはこちらに入れる。
 */

const DB_NAME = 'kiso-taion'
const DB_VERSION = 3

/** 保管する棚の名前 */
export const STORE_HANDLES = 'handles' // 保存先フォルダの鍵
export const STORE_IMAGES = 'images' // 画面のかざりの絵
export const STORE_SETS = 'sets' // お祝いのセット（絵＋ことば）

const STORES = [STORE_HANDLES, STORE_IMAGES, STORE_SETS]

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function run(storeName, mode, action) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode)
        const request = action(tx.objectStore(storeName))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }),
  )
}

export async function idbGet(store, key) {
  try {
    return (await run(store, 'readonly', (s) => s.get(key))) ?? null
  } catch {
    return null
  }
}

export async function idbGetAll(store) {
  try {
    const keys = await run(store, 'readonly', (s) => s.getAllKeys())
    const values = await run(store, 'readonly', (s) => s.getAll())
    return Object.fromEntries(keys.map((k, i) => [k, values[i]]))
  } catch {
    return {}
  }
}

export async function idbSet(store, key, value) {
  try {
    await run(store, 'readwrite', (s) => s.put(value, key))
    return true
  } catch {
    return false
  }
}

export async function idbDelete(store, key) {
  try {
    await run(store, 'readwrite', (s) => s.delete(key))
    return true
  } catch {
    return false
  }
}
