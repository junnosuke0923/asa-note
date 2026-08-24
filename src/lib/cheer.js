import { defaultCheerSets } from './customAssets'

/*
 * お祝いのセットを1つ選ぶ。
 *
 * 「この絵には この ことば」の組のまま返すので、
 * 呼ぶ側は絵と ことばの取り合わせを気にしなくてよい。
 */

/**
 * @param {Array}  sets      いま入っているセット
 * @param {string} [category] 'normal' | 'tough' | 'streak' | 'comeback'
 * @param {string} [previousText] 直前に出したことば。続けて同じものを出さないため
 */
export function pickCheerSet(sets, category, previousText) {
  // 全部消されていても何か返せるように、空なら はじめの分に戻す
  const all = Array.isArray(sets) && sets.length > 0 ? sets : defaultCheerSets()

  const inGroup = category ? all.filter((s) => s.category === category) : all
  // そのグループが空なら、全体から選ぶ
  const base = inGroup.length > 0 ? inGroup : all

  const candidates =
    base.length > 1 ? base.filter((s) => s.text !== previousText) : base

  return candidates[Math.floor(Math.random() * candidates.length)]
}

/** 連続日数に応じて、どのグループから選ぶか */
export function pickGroup(previousStreak, nextStreak) {
  if (previousStreak === 0 && nextStreak === 1) return 'comeback'
  if (nextStreak >= 3) return 'streak'
  return 'normal'
}
