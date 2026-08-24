import { useCallback, useEffect, useState } from 'react'
import { isEmptyRecord, normalizeRecord } from '../lib/records'
import { readJson, writeJson } from '../lib/storage'

/*
 * 記録の保存。
 *
 * 体温データは外に一切送らず、この端末のブラウザの中（LocalStorage）だけに置く。
 * 形は { "2026-08-23": { temperature, tags, period, flow, intimacy, weight, memo } }。
 *
 * v1（体温とタグだけ）で保存された記録も読めるように、
 * 読み込み時に normalizeRecord で今のかたちへ揃えている。
 * v1のキーはあえて消さない（万一の取り違えでも元データが残るように）。
 */
const STORAGE_KEY = 'kiso-taion:records:v2'
const LEGACY_KEY = 'kiso-taion:records:v1'

function parseStore(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
  return parsed
}

function normalizeStore(store) {
  const result = {}
  for (const [key, value] of Object.entries(store)) {
    // キーが "YYYY-MM-DD" の形でないものは捨てる
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue
    result[key] = normalizeRecord(value)
  }
  return result
}

function loadRecords() {
  const current = parseStore(readJson(STORAGE_KEY))
  if (current) return normalizeStore(current)

  // まだv2がない＝初回。古い記録があれば引き継ぐ
  const legacy = parseStore(readJson(LEGACY_KEY))
  if (legacy) return normalizeStore(legacy)

  return {}
}

export function useRecords() {
  const [records, setRecords] = useState(loadRecords)

  // 書けなかったときは storage 側が覚えていて、画面に警告が出る
  useEffect(() => {
    writeJson(STORAGE_KEY, records)
  }, [records])

  /**
   * その日の記録を部分的に書き換える。
   * 渡した項目だけ差し替え、触れていない項目はそのまま残す。
   */
  const updateRecord = useCallback((dateKey, patch) => {
    setRecords((prev) => {
      const base = prev[dateKey] ?? normalizeRecord(null)
      const merged = normalizeRecord({ ...base, ...patch })

      // 全部消された日は、記録そのものを取り除く
      if (isEmptyRecord(merged)) {
        if (!prev[dateKey]) return prev
        const next = { ...prev }
        delete next[dateKey]
        return next
      }

      return { ...prev, [dateKey]: merged }
    })
  }, [])

  const deleteRecord = useCallback((dateKey) => {
    setRecords((prev) => {
      if (!prev[dateKey]) return prev
      const next = { ...prev }
      delete next[dateKey]
      return next
    })
  }, [])

  /** 書き出し／読み込みで、記録をまるごと差し替える */
  const replaceAll = useCallback((incoming) => {
    setRecords(normalizeStore(incoming))
  }, [])

  return { records, updateRecord, deleteRecord, replaceAll }
}
