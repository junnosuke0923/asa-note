import { X } from 'lucide-react'
import { useState } from 'react'
import {
  buildShareText,
  copyText,
  isNativeShareSupported,
  lineShareUrl,
  shareNative,
} from '../lib/share'
import Icon from './Icon'

/*
 * 共有の確認画面。
 *
 * 送る前に必ず文面を見せる。体調の情報なので、
 * 何が相手に伝わるのか分からないまま送る形にはしない。
 * 文面はその場で書き足せる。
 */
function ShareSheet({ records, dateKey, cheerMessage, onClose }) {
  const [text, setText] = useState(() => buildShareText(records, dateKey, cheerMessage))
  const [message, setMessage] = useState(null)

  const handleNative = async () => {
    const result = await shareNative(text)
    if (result.ok) onClose()
    else if (result.code !== 'cancelled') {
      setMessage('この端末では 共有メニューが使えませんでした。')
    }
  }

  const handleCopy = async () => {
    const result = await copyText(text)
    setMessage(result.ok ? 'コピーしました。' : 'コピーできませんでした。')
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-warm-yellow">
      <div className="ink-line shrink-0 border-t-0 border-r-0 border-l-0 bg-paper px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-hand text-lg font-bold">パートナーに しらせる</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="とじる"
            className="ink-line blob-b sticker-shadow flex size-9 items-center justify-center bg-cheek active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 py-4">
          <div className="ink-line blob-a sticker-shadow bg-paper px-4 py-3">
            <p className="mb-2 text-[11px] font-black text-ink-soft">送る文（直せます）</p>
            <textarea
              rows={7}
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label="送る文"
              className="ink-line blob-b w-full resize-none bg-warm-yellow px-3 py-2 text-sm leading-relaxed font-bold outline-none focus:bg-paper"
            />
          </div>

          <a
            href={lineShareUrl(text)}
            target="_blank"
            rel="noreferrer"
            className="ink-line blob-b sticker-shadow flex items-center justify-center gap-2 bg-grass py-3 text-sm font-black active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
          >
            LINE で送る
          </a>

          {isNativeShareSupported() && (
            <button
              type="button"
              onClick={handleNative}
              className="ink-line blob-b sticker-shadow flex items-center justify-center gap-2 bg-hachi py-3 text-sm font-black active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
            >
              <Icon name="upload" size={17} />
              ほかのアプリで送る
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="ink-line blob-b sticker-shadow flex items-center justify-center gap-2 bg-paper py-3 text-sm font-black active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
          >
            <Icon name="note" size={17} />
            文をコピーする
          </button>

          {message && (
            <p className="text-center text-[11px] font-black text-grass-deep">{message}</p>
          )}

          <p className="pb-2 text-center text-[10px] leading-relaxed font-bold text-ink-soft">
            送るのは この文だけです。
            <br />
            アプリが かってに どこかへ送ることは ありません。
          </p>
        </div>
      </div>
    </div>
  )
}

export default ShareSheet
