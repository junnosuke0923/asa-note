import { useCallback, useEffect, useMemo, useState } from 'react'
import { bakedCheerSets, bakedDecorations } from '../data/appAssets'
import {
  clearCheerSets,
  defaultCheerSets,
  loadCheerSets,
  loadDecorations,
  normalizeCheerSets,
  removeDecoration,
  saveCheerSets,
  saveDecoration,
} from '../lib/customAssets'

/*
 * アプリで使う絵と ことば。
 *
 * できあがったアプリでは、焼きこまれた内容（appAssets.js）をそのまま使う。
 * 使う人が設定をいじる場面はないので、編集の仕組みは持たない。
 *
 * 開発中だけ、編集画面から変えられるようにしてある。
 * 変えたものは端末に控えておき、「アプリに焼きこむ」を押すと
 * appAssets.js に書き出されて、アプリ本体の中身になる。
 */

const IS_DEV = import.meta.env.DEV

const BAKED = {
  decorations: bakedDecorations ?? {},
  cheerSets: normalizeCheerSets(bakedCheerSets) ?? defaultCheerSets(),
}

export function useCustomAssets() {
  const [decorations, setDecorations] = useState(BAKED.decorations)
  const [cheerSets, setCheerSets] = useState(BAKED.cheerSets)

  // 前回いじりかけた内容を読み戻す（開発中だけ）
  useEffect(() => {
    if (!IS_DEV) return

    loadDecorations().then((stored) => {
      if (Object.keys(stored).length > 0) setDecorations(stored)
    })
    loadCheerSets().then((stored) => {
      if (stored) setCheerSets(stored)
    })
  }, [])

  /* ── 画面のかざり ── */

  const setDecoration = useCallback(async (slotId, dataUrl) => {
    await saveDecoration(slotId, dataUrl)
    setDecorations((prev) => ({ ...prev, [slotId]: dataUrl }))
  }, [])

  const clearDecoration = useCallback(async (slotId) => {
    await removeDecoration(slotId)
    setDecorations((prev) => {
      const next = { ...prev }
      delete next[slotId]
      return next
    })
  }, [])

  /* ── お祝いのセット ── */

  const updateCheerSets = useCallback((next) => {
    setCheerSets(next)
    saveCheerSets(next)
  }, [])

  const resetCheerSets = useCallback(() => {
    clearCheerSets()
    setCheerSets(defaultCheerSets())
  }, [])

  /** いまの内容を appAssets.js に書き出して、アプリ本体の中身にする */
  const bake = useCallback(async () => {
    try {
      const response = await fetch('/__bake-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decorations, cheerSets }),
      })
      const result = await response.json()
      return result.ok
        ? { ok: true, decorations: result.decorations, sets: result.sets }
        : { ok: false, error: result.error ?? '書き出せませんでした。' }
    } catch {
      return { ok: false, error: '開発中のときだけ 焼きこめます。' }
    }
  }, [decorations, cheerSets])

  /**
   * 焼きこんだ内容を、そのままスマホの公開URLにも送りだす。
   * 組み立てて GitHub Pages に push するので、数十秒かかる。
   */
  const publish = useCallback(async () => {
    try {
      const response = await fetch('/__publish', { method: 'POST' })
      const result = await response.json()
      return result.ok
        ? { ok: true, published: result.published }
        : { ok: false, error: result.error ?? '公開できませんでした。' }
    } catch {
      return { ok: false, error: '開発中のときだけ 公開できます。' }
    }
  }, [])

  return useMemo(
    () => ({
      decorations,
      cheerSets,
      isEditable: IS_DEV,
      setDecoration,
      clearDecoration,
      updateCheerSets,
      resetCheerSets,
      bake,
      publish,
    }),
    [
      decorations,
      cheerSets,
      setDecoration,
      clearDecoration,
      updateCheerSets,
      resetCheerSets,
      bake,
      publish,
    ],
  )
}
