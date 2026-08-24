/*
 * 小さな反応に出てくる子。
 *
 * 記録するたびに顔が変わると うれしいので、いくつか表情を用意した。
 * 大きなお祝い（CheerModal）の草とは別で、こちらは顔だけの小さい子。
 */

const INK = 'var(--color-ink)'
const PAPER = 'var(--color-paper)'
const CHEEK = 'var(--color-cheek)'
const USAGI = 'var(--color-usagi)'

/** 顔の土台。どの表情でも共通 */
function Base({ children }) {
  return (
    <>
      <circle cx="18" cy="19" r="14" fill={PAPER} stroke={INK} strokeWidth="2.6" />
      <ellipse cx="9.5" cy="22.5" rx="3.4" ry="2.4" fill={CHEEK} />
      <ellipse cx="26.5" cy="22.5" rx="3.4" ry="2.4" fill={CHEEK} />
      {children}
    </>
  )
}

const POSES = {
  // にこっ
  smile: (
    <Base>
      <circle cx="13" cy="17.5" r="1.7" fill={INK} />
      <circle cx="23" cy="17.5" r="1.7" fill={INK} />
      <path
        d="M15 23.5c1.2 1.5 4.8 1.5 6 0"
        stroke={INK}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </Base>
  ),

  // うれしくて目が細くなる
  happy: (
    <Base>
      <path
        d="M10.6 18.4c1.1-2 3.3-2 4.4 0M21 18.4c1.1-2 3.3-2 4.4 0"
        stroke={INK}
        strokeWidth="2.3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14.6 23c.9 2.6 5.9 2.6 6.8 0Z"
        fill="var(--color-cheek-deep)"
        stroke={INK}
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
    </Base>
  ),

  // きらきら（まわりに星）
  sparkle: (
    <>
      <Base>
        <circle cx="13" cy="17.5" r="1.7" fill={INK} />
        <circle cx="23" cy="17.5" r="1.7" fill={INK} />
        <ellipse cx="18" cy="24" rx="2.6" ry="3" fill="var(--color-cheek-deep)" stroke={INK} strokeWidth="2" />
      </Base>
      <path
        d="M32.5 7.5v5M30 10h5"
        stroke={USAGI}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M4 9v3.4M2.3 10.7h3.4" stroke={USAGI} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),

  // ちょっと得意げ
  proud: (
    <Base>
      <path
        d="M11 17.6h4M21 17.6h4"
        stroke={INK}
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <path
        d="M15 23.2c1.2 1.6 4.8 1.6 6 0"
        stroke={INK}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </Base>
  ),
}

function TinyChara({ pose = 'smile', size = 36, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {POSES[pose] ?? POSES.smile}
    </svg>
  )
}

export default TinyChara
