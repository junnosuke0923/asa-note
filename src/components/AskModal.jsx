import TinyChara from './TinyChara'

/*
 * 「ほんとうに これでいい？」と一度だけ聞く小さな確認。
 *
 * ブラウザ標準の確認窓は のっぺりしていて、
 * 朝いちばんに見るには そっけないので自前で用意した。
 */
function AskModal({ title, body, okLabel = 'これで いい', cancelLabel = 'なおす', onOk, onCancel }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="absolute inset-0 z-[70] flex items-center justify-center bg-ink/40 px-6"
    >
      <div className="animate-modal-pop ink-line blob-a sticker-shadow flex w-full max-w-xs flex-col items-center gap-3 bg-paper px-6 py-6 text-center">
        <TinyChara pose="proud" size={44} className="animate-puru" />

        <p className="font-hand text-lg leading-relaxed font-bold whitespace-pre-line">{title}</p>
        {body && <p className="text-xs leading-relaxed font-bold text-ink-soft">{body}</p>}

        <div className="mt-1 flex w-full flex-col gap-2">
          <button
            type="button"
            onClick={onOk}
            className="ink-line blob-pill sticker-shadow bg-cheek py-2.5 text-base font-black active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
          >
            {okLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="ink-line blob-pill sticker-shadow bg-paper py-2 text-sm font-black active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AskModal
