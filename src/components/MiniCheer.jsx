import TinyChara from './TinyChara'

/*
 * 記録したときの、小さな反応。
 *
 * カレンダーやまとめて入力でも「つけた」ことが伝わるように出す。
 * 大きなお祝いと違って画面をふさがないので、作業を続けられる。
 */
function MiniCheer({ cheer }) {
  if (!cheer) return null

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-4 z-[60] flex justify-center px-6"
      role="status"
      aria-live="polite"
    >
      <div
        key={cheer.key}
        className="animate-mini-cheer ink-line blob-pill sticker-shadow flex items-center gap-2 bg-paper py-1.5 pr-4 pl-2"
      >
        <TinyChara pose={cheer.pose} size={34} className="animate-pyokon" />
        <span className="font-hand text-sm font-bold whitespace-nowrap">{cheer.text}</span>
      </div>
    </div>
  )
}

export default MiniCheer
