/*
 * 1日ぶんの記録の「かたち」をここに集約する。
 *
 * 画面が増えても保存の形がバラバラにならないよう、
 * 読み込み時に必ず normalizeRecord を通して欠けている項目を埋める。
 */

/** 経血量。月経中の日だけ意味を持つ */
export const FLOW_LEVELS = [
  { id: 'light', label: 'すくない', dots: 1 },
  { id: 'medium', label: 'ふつう', dots: 2 },
  { id: 'heavy', label: 'おおい', dots: 3 },
]

export const EMPTY_RECORD = {
  temperature: null,
  time: null, // 測った時刻 "HH:MM"
  tags: [],
  period: false, // その日が月経中か
  flow: null,
  intimacy: false,
  weight: null,
  memo: '',
}

/** "07:05" の形か */
export function isValidTime(value) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

/** いまの時刻を "HH:MM" で */
export function nowTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function toFiniteOrNull(value) {
  const num = typeof value === 'string' ? Number(value) : value
  return typeof num === 'number' && Number.isFinite(num) ? num : null
}

/** 保存されていた値を、いまのかたちに揃える（古い記録もここで吸収する） */
export function normalizeRecord(raw) {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_RECORD }

  return {
    temperature: toFiniteOrNull(raw.temperature),
    time: isValidTime(raw.time) ? raw.time : null,
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t) => typeof t === 'string') : [],
    period: raw.period === true,
    flow: FLOW_LEVELS.some((level) => level.id === raw.flow) ? raw.flow : null,
    intimacy: raw.intimacy === true,
    weight: toFiniteOrNull(raw.weight),
    memo: typeof raw.memo === 'string' ? raw.memo : '',
    ...(raw.savedAt ? { savedAt: raw.savedAt } : {}),
  }
}

/**
 * 中身が空か。
 * 全項目を消したときに、空っぽの記録が「記録した日」として
 * 連続日数に数えられてしまうのを防ぐ。
 */
export function isEmptyRecord(record) {
  if (!record) return true
  return (
    record.temperature === null &&
    record.time === null &&
    record.tags.length === 0 &&
    record.period === false &&
    record.intimacy === false &&
    record.weight === null &&
    record.memo.trim() === ''
  )
}

/** 体温が入っている日だけを取り出す（グラフ・周期の計算用） */
export function withTemperature(records) {
  const result = {}
  for (const [key, record] of Object.entries(records)) {
    if (record?.temperature !== null && record?.temperature !== undefined) {
      result[key] = record
    }
  }
  return result
}
