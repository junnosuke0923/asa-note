import { useEffect, useState } from 'react'
import { isStorageAvailable, onStorageChange } from '../lib/storage'

/*
 * 保存領域が使えているかを見張る。
 *
 * 最初から使えないこともあれば、容量がいっぱいになって
 * 途中から書けなくなることもあるので、変化も拾う。
 */
export function useStorageHealth() {
  const [available, setAvailable] = useState(isStorageAvailable)

  useEffect(() => onStorageChange(setAvailable), [])

  return available
}
