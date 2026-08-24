/*
 * アプリで使うアイコン一式。
 *
 * もともと絵文字を使っていたが、絵文字は端末ごとに絵柄が変わるうえ、
 * 太い手描き線という このアプリの見た目から浮いてしまう。
 * 全部この画風で描き起こした。
 *
 * 描きかたの決めごと：
 *   ・24×24 のマス目、線の太さ 2.2、角と端は丸く
 *   ・線は焦茶（--color-ink）。純黒は使わない
 *   ・塗りはパステル。意味のある部分にだけ色を置く
 *     （体温＝ピンク、水／医療＝水色、草＝緑、しるし＝黄）
 */

const INK = 'var(--color-ink)'
const PAPER = 'var(--color-paper)'
const CHEEK = 'var(--color-cheek)'
const CHEEK_DEEP = 'var(--color-cheek-deep)'
const HACHI = 'var(--color-hachi)'
const USAGI = 'var(--color-usagi)'
const GRASS = 'var(--color-grass)'
const GRASS_DEEP = 'var(--color-grass-deep)'

const ICONS = {
  /* ── 下のタブ ───────────────────────────────── */

  // 体温計
  thermometer: (
    <>
      <path d="M9.8 5.6a2.2 2.2 0 0 1 4.4 0v8.3a4.4 4.4 0 1 1-4.4 0Z" fill={PAPER} />
      <circle cx="12" cy="17.4" r="2.7" fill={CHEEK_DEEP} stroke="none" />
      <path d="M12 15.4V7.8" stroke={CHEEK_DEEP} strokeWidth="2.2" />
    </>
  ),

  // カレンダー
  calendar: (
    <>
      <rect x="3.2" y="5.6" width="17.6" height="15.2" rx="3" fill={PAPER} />
      <path d="M8 3.2v4.2M16 3.2v4.2M3.6 10.4h16.8" />
      <circle cx="8.4" cy="14.4" r="1.15" fill={INK} stroke="none" />
      <circle cx="12" cy="14.4" r="1.15" fill={INK} stroke="none" />
      <circle cx="15.6" cy="17.6" r="1.6" fill={CHEEK} stroke="none" />
    </>
  ),

  // 折れ線グラフ（低温期から高温期へ上がる形）
  chart: (
    <>
      <path d="M4.2 3.6v15.6a1.2 1.2 0 0 0 1.2 1.2h15" />
      <path d="M7.2 16.2 10.6 16.8 13.4 9.8 17.6 9" fill="none" strokeWidth="2.4" />
      <circle cx="7.2" cy="16.2" r="1.7" fill={HACHI} />
      <circle cx="10.6" cy="16.8" r="1.7" fill={HACHI} />
      <circle cx="13.4" cy="9.8" r="1.7" fill={CHEEK} />
      <circle cx="17.6" cy="9" r="1.7" fill={CHEEK} />
    </>
  ),

  // 草（草むしり検定）
  sprout: (
    <>
      <path d="M12 20.4v-8.6" />
      <path d="M11.8 13.2c0-2.6-2-5.4-4.6-6.2-2-.6-3.3.5-2.8 2.3.6 2.8 3.8 5.3 7.4 3.9Z" fill={GRASS} />
      <path d="M12.2 12.4c.2-2.9 2.3-6 5.1-6.9 2.2-.7 3.6.6 3 2.5-.7 3-4.4 5.7-8.1 4.4Z" fill={GRASS_DEEP} />
      <path d="M7.4 20.4h9.2" />
    </>
  ),

  // 設定（つまみ）
  sliders: (
    <>
      <path d="M3.8 6.6h16.4M3.8 12h16.4M3.8 17.4h16.4" strokeWidth="2" />
      <circle cx="8.6" cy="6.6" r="2.5" fill={USAGI} strokeWidth="2" />
      <circle cx="15.4" cy="12" r="2.5" fill={HACHI} strokeWidth="2" />
      <circle cx="10.4" cy="17.4" r="2.5" fill={CHEEK} strokeWidth="2" />
    </>
  ),

  /* ── スタンプ ───────────────────────────────── */

  // おくすり（カプセル）
  pill: (
    <g transform="rotate(-38 12 12)">
      <rect x="2.6" y="8.8" width="18.8" height="6.4" rx="3.2" fill={PAPER} />
      <path d="M12 8.8h6.2a3.2 3.2 0 0 1 0 6.4H12Z" fill={USAGI} />
      <path d="M12 8.8v6.4" />
    </g>
  ),

  // つういん（十字のたてもの）
  clinic: (
    <>
      <path d="M3 9.2 12 3.6l9 5.6" fill="none" />
      <path d="M5 9.6h14v9.8a1.4 1.4 0 0 1-1.4 1.4H6.4A1.4 1.4 0 0 1 5 19.4Z" fill={PAPER} />
      <path d="M12 12v5.4M9.3 14.7h5.4" stroke={CHEEK_DEEP} strokeWidth="2.4" />
    </>
  ),

  // しんどい（ぐったりした顔）
  unwell: (
    <>
      <circle cx="11.4" cy="12.4" r="8.3" fill={PAPER} />
      <circle cx="8.6" cy="11" r="1.15" fill={INK} stroke="none" />
      <circle cx="14.2" cy="11" r="1.15" fill={INK} stroke="none" />
      <path d="M8.2 16.2c1-1.2 2-1.2 3 0s2 1.2 3 0" strokeWidth="1.9" />
      <path d="M19.4 4.2c1.6 2 1.9 2.7 1.9 3.4a1.9 1.9 0 1 1-3.8 0c0-.7.3-1.4 1.9-3.4Z" fill={HACHI} strokeWidth="1.9" />
    </>
  ),

  /* ── 記録の中身 ─────────────────────────────── */

  // 月経（しずく）
  drop: (
    <path
      d="M12 2.8c3.6 5.6 6.6 8.1 6.6 11.3a6.6 6.6 0 1 1-13.2 0C5.4 10.9 8.4 8.4 12 2.8Z"
      fill={CHEEK_DEEP}
    />
  ),

  // なかよし（ハート）
  heart: (
    <path
      d="M12 20.6C3.9 15 3 10.6 5.5 7.6c2.3-2.8 5.6-1.9 6.5.5.9-2.4 4.2-3.3 6.5-.5 2.5 3 1.6 7.4-6.5 13Z"
      fill={CHEEK}
    />
  ),

  // メモ
  note: (
    <>
      <path d="M6 3.4h8.2l4.6 4.6v12.6H6Z" fill={PAPER} />
      <path d="M14.2 3.4V8h4.6" />
      <path d="M9 12.6h6M9 16h4" strokeWidth="1.9" />
    </>
  ),

  // えんぴつ（まとめて入力）
  pencil: (
    <>
      <path d="m4 20 1.2-4.4L16.4 4.4l3.2 3.2L8.4 18.8Z" fill={USAGI} />
      <path d="m14.6 6.2 3.2 3.2M5.2 15.6l3.2 3.2" strokeWidth="1.9" />
    </>
  ),

  /* ── 設定の中身 ─────────────────────────────── */

  // 書き出す
  download: (
    <>
      <path d="M12 3.6v10.2" strokeWidth="2.4" />
      <path d="m7.8 10 4.2 4.2 4.2-4.2" strokeWidth="2.4" />
      <path d="M4.4 16.4v2.2a1.8 1.8 0 0 0 1.8 1.8h11.6a1.8 1.8 0 0 0 1.8-1.8v-2.2" fill="none" />
    </>
  ),

  // 読みこむ
  upload: (
    <>
      <path d="M12 14.2V4" strokeWidth="2.4" />
      <path d="m7.8 8.2 4.2-4.2 4.2 4.2" strokeWidth="2.4" />
      <path d="M4.4 16.4v2.2a1.8 1.8 0 0 0 1.8 1.8h11.6a1.8 1.8 0 0 0 1.8-1.8v-2.2" fill="none" />
    </>
  ),

  // 表（CSV）
  table: (
    <>
      <rect x="3.2" y="4.8" width="17.6" height="14.4" rx="2.6" fill={PAPER} />
      <path d="M3.4 9.6h17.2" />
      <path d="M3.6 9.6h16.8v-2.2a2.6 2.6 0 0 0-2.6-2.6H6.2a2.6 2.6 0 0 0-2.6 2.6Z" fill={HACHI} />
      <path d="M12 9.8v9.2M3.4 14.4h17.2" strokeWidth="1.9" />
    </>
  ),

  // プリンター
  printer: (
    <>
      <path d="M7 3.6h10v4.2H7Z" fill={PAPER} />
      <path d="M4.6 8h14.8a1.8 1.8 0 0 1 1.8 1.8v4.6a1.8 1.8 0 0 1-1.8 1.8H4.6a1.8 1.8 0 0 1-1.8-1.8V9.8A1.8 1.8 0 0 1 4.6 8Z" fill={HACHI} />
      <path d="M7 13.4h10v7H7Z" fill={PAPER} />
      <circle cx="17.6" cy="10.8" r=".9" fill={INK} stroke="none" />
    </>
  ),

  // おしらせ（ベル）
  bell: (
    <>
      <path d="M12 3.4a5.8 5.8 0 0 1 5.8 5.8c0 4 1.4 5.6 1.4 5.6H4.8s1.4-1.6 1.4-5.6A5.8 5.8 0 0 1 12 3.4Z" fill={USAGI} />
      <path d="M9.8 18a2.2 2.2 0 0 0 4.4 0" />
    </>
  ),

  bellOff: (
    <>
      <path d="M12 3.4a5.8 5.8 0 0 1 5.8 5.8c0 4 1.4 5.6 1.4 5.6H4.8s1.4-1.6 1.4-5.6A5.8 5.8 0 0 1 12 3.4Z" fill={PAPER} />
      <path d="M9.8 18a2.2 2.2 0 0 0 4.4 0" />
      <path d="M4 3.6 20 20.4" strokeWidth="2.4" />
    </>
  ),

  // フォルダ
  folder: (
    <>
      <path d="M3.4 7.4A1.8 1.8 0 0 1 5.2 5.6h4.2l2.2 2.8h7.2a1.8 1.8 0 0 1 1.8 1.8v8.4a1.8 1.8 0 0 1-1.8 1.8H5.2a1.8 1.8 0 0 1-1.8-1.8Z" fill={USAGI} />
    </>
  ),

  // まだ開いていない（かぎ）
  lock: (
    <>
      <path d="M8.4 10.4V8a3.6 3.6 0 0 1 7.2 0v2.4" fill="none" />
      <rect x="4.8" y="10.4" width="14.4" height="9.4" rx="2.6" fill={PAPER} />
      <circle cx="12" cy="15.1" r="1.5" fill={INK} stroke="none" />
    </>
  ),

  /* ── 草むしり検定のバッジ ───────────────────── */

  seed: (
    <>
      <path d="M5.6 18.4c3.6-1.6 9.2-1.6 12.8 0" />
      <ellipse cx="12" cy="13.4" rx="3.6" ry="2.8" fill={USAGI} />
    </>
  ),

  clover: (
    <>
      <path d="M12 20.4v-6" />
      <circle cx="8.4" cy="10.6" r="3.5" fill={GRASS} />
      <circle cx="15.6" cy="10.6" r="3.5" fill={GRASS} />
      <circle cx="12" cy="5.8" r="3.5" fill={GRASS_DEEP} />
    </>
  ),

  grass: (
    <>
      <path d="M12 20.4c0-4.4.6-8.6 2.6-12.6" fill="none" />
      <path d="M12 20.4c0-3.6-1.2-7-3.4-10" fill="none" />
      <path d="M12 20.4c0-2.6 1.6-5.4 4.6-7.6" fill="none" />
      <path d="M5.6 20.4h12.8" />
    </>
  ),

  bud: (
    <>
      <path d="M12 20.4v-6.2" />
      <path d="M12 4.4c2.8 3.4 4 5.4 4 7.2a4 4 0 0 1-8 0c0-1.8 1.2-3.8 4-7.2Z" fill={CHEEK} />
      <path d="M12 14.2c-1.8 0-3-1.2-3.6-2.6" fill="none" strokeWidth="1.9" />
    </>
  ),

  flower: (
    <>
      <path d="M12 20.4v-5.6" />
      <g>
        <ellipse cx="12" cy="6.6" rx="2.7" ry="3.9" fill={CHEEK} />
        <ellipse cx="12" cy="6.6" rx="2.7" ry="3.9" fill={CHEEK} transform="rotate(72 12 10.2)" />
        <ellipse cx="12" cy="6.6" rx="2.7" ry="3.9" fill={CHEEK} transform="rotate(144 12 10.2)" />
        <ellipse cx="12" cy="6.6" rx="2.7" ry="3.9" fill={CHEEK} transform="rotate(216 12 10.2)" />
        <ellipse cx="12" cy="6.6" rx="2.7" ry="3.9" fill={CHEEK} transform="rotate(288 12 10.2)" />
      </g>
      <circle cx="12" cy="10.2" r="2.5" fill={USAGI} />
    </>
  ),

  crown: (
    <>
      <path d="M3.6 18.2V8.4l4.6 3.4L12 5.2l3.8 6.6 4.6-3.4v9.8Z" fill={USAGI} />
      <path d="M3.6 18.2h16.8" />
    </>
  ),

  mountain: (
    <>
      <path d="M2.2 19.4 9 7.2l3.6 5.4 2.8-3.6 6.4 10.4Z" fill={HACHI} />
      <path d="M6.4 12.6c1.6 1 3.6 1 5.2 0" strokeWidth="1.9" />
    </>
  ),
}

function Icon({ name, size = 22, className = '', title }) {
  const content = ICONS[name]
  if (!content) return null

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={INK}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {content}
    </svg>
  )
}

export default Icon
