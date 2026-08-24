import { useCallback, useEffect, useState } from 'react'
import { readJson, writeJson } from '../lib/storage'

const STORAGE_KEY = 'kiso-taion:settings:v1'

export const THEMES = ['auto', 'light', 'dark']

export const DEFAULT_SETTINGS = {
  reminderEnabled: false,
  reminderTime: '07:00', // 毎朝この時刻に「はかってね」と知らせる
  folderAutoSave: false, // 記録するたび、選んだフォルダへ控えを書き出すか
  // 既定は明るい画面。端末が暗い設定でも、こちらが勝手に暗くならないようにする
  theme: 'light', // 'light'（明るい）| 'dark'（暗い）| 'auto'（端末にあわせる）
}

function loadSettings() {
  const parsed = readJson(STORAGE_KEY)
  if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_SETTINGS }

  return {
    reminderEnabled: parsed.reminderEnabled === true,
    reminderTime: /^\d{2}:\d{2}$/.test(parsed.reminderTime)
      ? parsed.reminderTime
      : DEFAULT_SETTINGS.reminderTime,
    folderAutoSave: parsed.folderAutoSave === true,
    theme: THEMES.includes(parsed.theme) ? parsed.theme : DEFAULT_SETTINGS.theme,
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(loadSettings)

  useEffect(() => {
    writeJson(STORAGE_KEY, settings)
  }, [settings])

  /*
   * 明るさの設定を、ページ全体に伝える。
   * CSS 側はこの印を見て色を差し替えるので、
   * 各画面のコードは何も知らなくてよい。
   */
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme
  }, [settings.theme])

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  return { settings, updateSettings }
}
