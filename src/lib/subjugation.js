/*
 * 討伐。
 *
 * 原作では、草むしりが日々のしごとで、討伐は たまに来る大変なしごと。
 * このアプリでも同じ関係にしてある。
 *   草むしり … 毎朝つづけて記録すること（＝検定の級）
 *   討伐   … その日の むずかしさを越えて記録できたこと
 *
 * 言葉づかいには気をつけている。
 * 倒す相手は「体」でも「治療」でもなく、あくまで
 * 「その朝の しんどさ」「あいてしまった間」のほう。
 * 体調や治療そのものを 敵に見立てる書きかたはしない。
 */

import { shiftKey } from './dateUtils'

/** 何を越えたのか */
export const SUBJUGATION_KINDS = [
  {
    id: 'unwell',
    label: 'しんどい朝',
    icon: 'unwell',
    note: '体調がよくない日でも つけた',
  },
  {
    id: 'clinic',
    label: '通院の日',
    icon: 'clinic',
    note: '病院のある日でも つけた',
  },
  {
    id: 'comeback',
    label: 'もどってきた日',
    icon: 'sprout',
    note: '間があいたあと また つけはじめた',
  },
]

/** 何日あいたら「もどってきた」とみなすか */
const GAP_DAYS = 4

const measured = (record) => record != null && record.temperature != null

/**
 * 討伐した日を集める。
 *
 * 体温を測った日だけが対象。
 * 記録していない日は、越えたかどうかも分からないため。
 *
 * @returns {{ total:number, byKind:Object, days:Array<{key:string, kinds:string[]}> }}
 */
export function getSubjugations(records, treatments = {}) {
  const measuredKeys = Object.keys(records)
    .filter((key) => measured(records[key]))
    .sort()

  const days = []
  const byKind = { unwell: 0, clinic: 0, comeback: 0 }

  measuredKeys.forEach((key, index) => {
    const kinds = []

    if (records[key].tags?.includes('unwell')) kinds.push('unwell')
    if (treatments[key]?.visited) kinds.push('clinic')

    // ひとつ前に測った日から どれだけあいたか
    const previous = measuredKeys[index - 1]
    if (previous) {
      let gap = 1
      let cursor = shiftKey(previous, 1)
      while (cursor !== key && gap < 400) {
        gap += 1
        cursor = shiftKey(cursor, 1)
      }
      if (gap >= GAP_DAYS) kinds.push('comeback')
    }

    if (kinds.length === 0) return

    kinds.forEach((k) => {
      byKind[k] += 1
    })
    days.push({ key, kinds })
  })

  return { total: days.length, byKind, days }
}

/** その日は討伐にあたるか（記録した直後のお祝いで使う） */
export function getSubjugationKinds(records, treatments, dateKey) {
  return getSubjugations(records, treatments).days.find((d) => d.key === dateKey)?.kinds ?? []
}

/** 討伐の数に応じた ひとこと */
export function describeSubjugation(total) {
  if (total === 0) return 'まだ 討伐はナシ'
  if (total < 3) return 'はじめての討伐'
  if (total < 10) return 'なかなか やるじゃん'
  if (total < 30) return 'ベテランの風格'
  return 'もう 討伐のプロ'
}
