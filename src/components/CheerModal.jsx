import { useMemo } from 'react'
import AppImage from './AppImage'
import { SUBJUGATION_KINDS } from '../lib/subjugation'
import Icon from './Icon'
import Sprout from './Sprout'

const CONFETTI_COLORS = [
  'var(--color-cheek)',
  'var(--color-hachi)',
  'var(--color-usagi)',
  'var(--color-grass)',
  'var(--color-cheek-deep)',
]

function buildConfettiPieces(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.7,
    duration: 2.1 + Math.random() * 1.3,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    width: 7 + Math.random() * 6,
    height: 9 + Math.random() * 8,
  }))
}

/**
 * 記録できたときのお祝い。
 *
 * 絵と ことばは「セット」で渡ってくるので、
 * 組み合わせはここでは決めない。
 *
 * 級が上がったときは、そのことを大きく知らせる。
 * 紙吹雪も増やして、ふだんの記録と はっきり差をつける。
 */
function CheerModal({ message, image, certification, subjugation, onClose, onShare }) {
  const isBadge = Boolean(certification)
  const confettiPieces = useMemo(() => buildConfettiPieces(isBadge ? 52 : 30), [isBadge])

  const beaten = (subjugation ?? [])
    .map((id) => SUBJUGATION_KINDS.find((k) => k.id === id))
    .filter(Boolean)

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="absolute inset-0 z-50 flex items-center justify-center bg-ink/35 px-6"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confettiPieces.map((piece) => (
          <span
            key={piece.id}
            className="animate-confetti-fall absolute rounded-[3px] border-2 border-ink"
            style={{
              left: `${piece.left}%`,
              width: piece.width,
              height: piece.height,
              backgroundColor: piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="animate-modal-pop ink-line blob-a sticker-shadow relative flex max-h-full w-full max-w-xs flex-col items-center gap-3 overflow-y-auto bg-paper px-6 py-6 text-center">
        {/* 級が上がったとき。まずこれを見せる */}
        {isBadge && (
          <div className="ink-line blob-a sticker-shadow w-full bg-usagi px-3 py-3">
            <p className="text-[11px] font-black text-ink-soft">草むしり検定</p>
            <div className="my-1 flex justify-center">
              <span className="ink-line sticker-shadow flex size-14 items-center justify-center rounded-full bg-paper">
                <Icon name={certification.icon} size={30} />
              </span>
            </div>
            <p className="font-hand text-xl leading-tight font-bold">
              {certification.label}
              <br />
              とれたよ！
            </p>
            <p className="mt-1 text-[11px] font-bold text-ink-soft">{certification.note}</p>
          </div>
        )}

        <AppImage
          src={image}
          size={isBadge ? 96 : 120}
          className="animate-fuwa"
          fallback={<Sprout size={isBadge ? 78 : 98} className="animate-fuwa" />}
        />

        <p className="font-hand text-2xl leading-relaxed font-bold whitespace-pre-line">
          {message}
        </p>

        {/* しんどい朝や 通院の日を越えたときは、そこも ちゃんと言う */}
        {beaten.length > 0 && (
          <div className="ink-line blob-b w-full bg-grass px-3 py-2">
            <p className="text-[11px] font-black">討伐 かんりょう</p>
            <p className="mt-0.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              {beaten.map((kind) => (
                <span key={kind.id} className="flex items-center gap-1 text-xs font-black">
                  <Icon name={kind.icon} size={14} />
                  {kind.label}
                </span>
              ))}
            </p>
          </div>
        )}

        <div className="flex w-full flex-col gap-2">
          <button
            type="button"
            onClick={onClose}
            className="ink-line blob-pill sticker-shadow bg-hachi py-2 text-lg font-black transition active:translate-x-[3px] active:translate-y-[4px] active:shadow-none"
          >
            ウン
          </button>

          {onShare && (
            <button
              type="button"
              onClick={onShare}
              className="ink-line blob-pill sticker-shadow flex items-center justify-center gap-1.5 bg-grass py-2 text-sm font-black transition active:translate-x-[3px] active:translate-y-[4px] active:shadow-none"
            >
              <Icon name="heart" size={16} />
              しらせる
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CheerModal
