/*
 * 不妊治療そのものの記録。
 *
 * 体温の記録とは分けて持つ。理由は2つ。
 *   ・毎朝つける体温と、通院した日だけつける治療記録では、書く頻度が違う
 *   ・治療をしていない時期に、体温の記録まで重くならないようにする
 *
 * 数値の項目は、入力途中の文字列ではなく数値か null で持つ。
 */

/** ホルモン値。単位は検査結果票の表記に合わせている */
export const HORMONE_FIELDS = [
  { id: 'e2', label: 'E2', unit: 'pg/mL', hint: 'エストロゲン' },
  { id: 'lh', label: 'LH', unit: 'mIU/mL', hint: '黄体形成ホルモン' },
  { id: 'fsh', label: 'FSH', unit: 'mIU/mL', hint: '卵胞刺激ホルモン' },
  { id: 'p4', label: 'P4', unit: 'ng/mL', hint: 'プロゲステロン' },
]

export const EMPTY_TREATMENT = {
  visited: false,
  clinic: '',
  content: '', // 診察・処置の内容
  meds: '', // 飲み薬
  injection: '', // 注射
  hormones: { e2: null, lh: null, fsh: null, p4: null },
  follicleL: null, // 卵胞サイズ 左（mm）
  follicleR: null, // 卵胞サイズ 右（mm）
  endometrium: null, // 内膜の厚さ（mm）
  cost: null, // その日の支払い（円）
  memo: '',
}

function toFiniteOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function toText(value) {
  return typeof value === 'string' ? value : ''
}

export function normalizeTreatment(raw) {
  if (!raw || typeof raw !== 'object') return structuredClone(EMPTY_TREATMENT)

  const hormones = raw.hormones && typeof raw.hormones === 'object' ? raw.hormones : {}

  return {
    visited: raw.visited === true,
    clinic: toText(raw.clinic),
    content: toText(raw.content),
    meds: toText(raw.meds),
    injection: toText(raw.injection),
    hormones: Object.fromEntries(
      HORMONE_FIELDS.map((field) => [field.id, toFiniteOrNull(hormones[field.id])]),
    ),
    follicleL: toFiniteOrNull(raw.follicleL),
    follicleR: toFiniteOrNull(raw.follicleR),
    endometrium: toFiniteOrNull(raw.endometrium),
    cost: toFiniteOrNull(raw.cost),
    memo: toText(raw.memo),
  }
}

export function isEmptyTreatment(treatment) {
  if (!treatment) return true

  const hasHormone = HORMONE_FIELDS.some((field) => treatment.hormones[field.id] !== null)

  return (
    treatment.visited === false &&
    treatment.clinic.trim() === '' &&
    treatment.content.trim() === '' &&
    treatment.meds.trim() === '' &&
    treatment.injection.trim() === '' &&
    treatment.follicleL === null &&
    treatment.follicleR === null &&
    treatment.endometrium === null &&
    treatment.cost === null &&
    treatment.memo.trim() === '' &&
    !hasHormone
  )
}

/** 期間内の治療費の合計。医療費控除や助成金の申請でまとめて見たいので */
export function sumCost(treatments, fromKey, toKey) {
  return Object.entries(treatments)
    .filter(([key]) => (!fromKey || key >= fromKey) && (!toKey || key <= toKey))
    .reduce((total, [, treatment]) => total + (treatment.cost ?? 0), 0)
}

/** 通院した日だけを新しい順に */
export function getVisitDays(treatments) {
  return Object.keys(treatments)
    .filter((key) => !isEmptyTreatment(treatments[key]))
    .sort()
    .reverse()
}
