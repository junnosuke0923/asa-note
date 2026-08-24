import { useEffect, useRef, useState } from 'react'
import { buildBackup } from '../lib/backup'
import { saveToFolder } from '../lib/folderSave'

/*
 * 記録が変わったら、覚えているフォルダへ自動で書き出す。
 *
 * 同期フォルダ（Googleドライブなど）を選んでおけば、
 * 意識しなくてもクラウドに控えが残る。ブラウザの記録が消えても戻せる。
 *
 * 書くたびに保存すると重いので、手が止まってからまとめて1回書く。
 * ファイル名は日付を入れず固定にして、同じファイルを上書きする
 * （毎日ちがう名前にすると、フォルダがバックアップだらけになるため）。
 */

const FILENAME = '基礎体温バックアップ.json'
const DEBOUNCE_MS = 4000

export function useFolderAutoSave({ enabled, records, treatments, settings }) {
  const [status, setStatus] = useState(null) // null | 'saving' | 'saved' | 'error'
  const timerRef = useRef(null)
  const isFirstRun = useRef(true)

  // 記録が変わるたびにこの effect が動き直すので、
  // タイマーの中身は常に最新の記録を掴んでいる（ref に控える必要はない）
  useEffect(() => {
    if (!enabled) return

    // 画面を開いた直後にいきなり書き込まない
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setStatus('saving')

      const payload = JSON.stringify(buildBackup(records, treatments, settings), null, 2)

      // 自動保存では許可ダイアログを出さない。
      // 勝手にダイアログが出ると、記録の操作をさえぎってしまうため
      const result = await saveToFolder(FILENAME, payload, { ask: false })
      setStatus(result.ok ? 'saved' : 'error')
    }, DEBOUNCE_MS)

    return () => clearTimeout(timerRef.current)
  }, [enabled, records, treatments, settings])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return status
}

export const AUTO_SAVE_FILENAME = FILENAME
