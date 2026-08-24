/*
 * グラフの下に並べる「しるしの帯」。
 *
 * ■ なぜ必要か
 *
 * おくすり・つういん・しんどい・なかよし は、これまで
 * 点をタップしないと見えなかった。しかしこれらを記録する目的は
 * 「あとで体温の線と見くらべること」なので、ひと目で見えないと意味がない。
 *
 *   ・しんどい … その日の体温が信用できるかどうかの手がかり。
 *                風邪や寝不足で上がった山を、高温期と読み違えないため
 *   ・おくすり … 薬で体温が動くことがあるので、線の変化と重ねて見る
 *   ・つういん … 処置の日と体温の動きの関係を、診察のときに説明できる
 *   ・なかよし … 基礎体温表の本来の目的そのもの。タイミングと排卵の位置関係
 *
 * ■ 帯にしている理由
 *
 * 日ごとに点を打つと、90日表示では点が重なって読めない。
 * 続いている日はひとつながりの帯にまとめると、
 * 「この期間ずっと薬を飲んでいた」が形として見える。月経の帯と同じ考えかた。
 *
 * ■ 記録が2か所にある項目について
 *
 * おくすりと つういん は、朝のスタンプ（tags）と 治療記録（treatments）の
 * どちらにも書ける。書いた場所によって帯が出たり出なかったりすると
 * 混乱するので、どちらかにあれば帯を出す。
 */

/*
 * 並び順は 記録画面のスタンプ（おくすり・つういん・しんどい）と
 * そろえてある。同じものが 画面ごとにちがう順で並んでいると、
 * 探すたびに 目で追い直すことになるため。
 * なかよしは スタンプに無い項目なので、そのあとに置く。
 */
export const MARKER_LANES = [
  {
    id: 'medicine',
    icon: 'pill',
    label: 'おくすり',
    color: 'var(--color-usagi)',
    match: (record, treatment) =>
      record?.tags?.includes('medicine') === true ||
      (treatment?.meds ?? '').trim() !== '' ||
      (treatment?.injection ?? '').trim() !== '',
  },
  {
    id: 'clinic',
    icon: 'clinic',
    label: 'つういん',
    color: 'var(--color-grass)',
    match: (record, treatment) =>
      record?.tags?.includes('hospital') === true || treatment?.visited === true,
  },
  {
    id: 'unwell',
    icon: 'unwell',
    label: 'しんどい',
    color: 'var(--color-hachi)',
    match: (record) => record?.tags?.includes('unwell') === true,
  },
  {
    id: 'intimacy',
    icon: 'heart',
    label: 'なかよし',
    color: 'var(--color-cheek)',
    match: (record) => record?.intimacy === true,
  },
]

/**
 * 続いている日をひとつの帯にまとめる。
 * hit(key, index) が true の日を拾う。月経の帯にも使う。
 */
export function buildBands(dayKeys, hit) {
  const bands = []

  dayKeys.forEach((key, index) => {
    if (!hit(key, index)) return

    const last = bands[bands.length - 1]
    if (last && last.endIndex === index - 1) last.endIndex = index
    else bands.push({ startIndex: index, endIndex: index })
  })

  return bands
}

/**
 * 表示する期間ぶんの帯を、しるしの種類ごとに作る。
 * 1つも無い種類は行ごと出さない。使っていない項目で
 * グラフが縦に伸びてしまうと、肝心の線が小さくなるため。
 */
export function buildMarkerLanes(dayKeys, records, treatments = {}) {
  return MARKER_LANES.map((lane) => ({
    ...lane,
    bands: buildBands(dayKeys, (key) => lane.match(records[key], treatments[key])),
  })).filter((lane) => lane.bands.length > 0)
}

/** 体温が当てにならないかもしれない日。グラフの点に印をつけるのに使う */
export function getUnwellDays(dayKeys, records) {
  return new Set(dayKeys.filter((key) => records[key]?.tags?.includes('unwell')))
}
