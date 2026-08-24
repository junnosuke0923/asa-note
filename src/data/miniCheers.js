/*
 * 小さな反応の ことば。
 *
 * 記録のしかたによって出しわける。
 * 大きなお祝い（cheerMessages）とちがって、
 * 作業のじゃまにならないよう ひとことだけ。
 */

const POOLS = {
  temperature: ['つけた！', 'ヨシ', 'えらい', 'オッケー', 'できた'],
  period: ['メモした', 'わかった', 'おつかれさま', 'ヨシ'],
  tag: ['ヨシ', 'わかった', 'メモした'],
  intimacy: ['メモした', 'ヨシ'],
  weight: ['ヨシ', 'つけた！'],
  treatment: ['おつかれさま', 'がんばったね', 'えらい', 'ヨシ'],
}

const POSES = {
  temperature: ['happy', 'smile', 'sparkle'],
  period: ['smile', 'proud'],
  tag: ['smile', 'proud'],
  intimacy: ['smile', 'happy'],
  weight: ['smile', 'proud'],
  treatment: ['happy', 'sparkle', 'smile'],
}

const pick = (list) => list[Math.floor(Math.random() * list.length)]

export function buildMiniCheer(kind) {
  return {
    text: pick(POOLS[kind] ?? POOLS.temperature),
    pose: pick(POSES[kind] ?? POSES.temperature),
  }
}

/**
 * この書きかえは、反応を出すに値するか。
 * メモや自由入力は、1文字打つたびに反応すると うるさいので出さない。
 */
export function recordCheerKind(patch, before) {
  if (typeof patch.temperature === 'number') return 'temperature'
  if (patch.period === true && before?.period !== true) return 'period'
  if (patch.intimacy === true && before?.intimacy !== true) return 'intimacy'
  if (Array.isArray(patch.tags) && patch.tags.length > (before?.tags?.length ?? 0)) return 'tag'
  if (typeof patch.weight === 'number') return 'weight'
  return null
}

export function treatmentCheerKind(patch, before) {
  if (patch.visited === true && before?.visited !== true) return 'treatment'
  return null
}
