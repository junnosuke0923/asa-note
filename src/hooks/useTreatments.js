import { useCallback, useEffect, useState } from 'react'
import { isEmptyTreatment, normalizeTreatment } from '../lib/treatments'
import { readJson, writeJson } from '../lib/storage'

const STORAGE_KEY = 'kiso-taion:treatments:v1'

function loadTreatments() {
  const parsed = readJson(STORAGE_KEY)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}

  const result = {}
  for (const [key, value] of Object.entries(parsed)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue
    result[key] = normalizeTreatment(value)
  }
  return result
}

export function useTreatments() {
  const [treatments, setTreatments] = useState(loadTreatments)

  useEffect(() => {
    writeJson(STORAGE_KEY, treatments)
  }, [treatments])

  const updateTreatment = useCallback((dateKey, patch) => {
    setTreatments((prev) => {
      const base = prev[dateKey] ?? normalizeTreatment(null)
      const merged = normalizeTreatment({
        ...base,
        ...patch,
        hormones: { ...base.hormones, ...(patch.hormones ?? {}) },
      })

      if (isEmptyTreatment(merged)) {
        if (!prev[dateKey]) return prev
        const next = { ...prev }
        delete next[dateKey]
        return next
      }

      return { ...prev, [dateKey]: merged }
    })
  }, [])

  const replaceAll = useCallback((incoming) => {
    const result = {}
    for (const [key, value] of Object.entries(incoming ?? {})) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue
      result[key] = normalizeTreatment(value)
    }
    setTreatments(result)
  }, [])

  return { treatments, updateTreatment, replaceAll }
}
