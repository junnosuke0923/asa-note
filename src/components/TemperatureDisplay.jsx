import { useEffect, useRef, useState } from 'react'

const MIN = 35
const MAX = 38.5

/*
 * 大きな体温表示。
 *
 * 体温計の数字がすでに手元にあるときは、なぞるより打ち込むほうが速い。
 * 数字をタップすると そのまま入力できるようにしてある。
 */
function TemperatureDisplay({ value, isBumping, onChange }) {
  const [draft, setDraft] = useState(null)
  const inputRef = useRef(null)

  const editable = typeof onChange === 'function'
  const isEditing = draft !== null

  useEffect(() => {
    if (isEditing) inputRef.current?.select()
  }, [isEditing])

  const commit = () => {
    const parsed = Number(draft)
    if (Number.isFinite(parsed) && parsed >= MIN && parsed <= MAX) {
      onChange(Math.round(parsed * 100) / 100)
    }
    setDraft(null)
  }

  const [wholePart, decimalPart] = value.toFixed(2).split('.')

  return (
    <div
      className={`ink-line blob-a sticker-shadow bg-paper px-6 py-6 ${
        isBumping ? 'animate-pyokon' : ''
      }`}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          inputMode="decimal"
          step="0.01"
          min={MIN}
          max={MAX}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') setDraft(null)
          }}
          aria-label="体温を 数字で入れる"
          className="w-full bg-transparent text-center text-6xl leading-none font-black tabular-nums outline-none"
        />
      ) : (
        <button
          type="button"
          disabled={!editable}
          onClick={() => setDraft(value.toFixed(2))}
          aria-label={editable ? `体温 ${value.toFixed(2)}度。タップで 数字を打ちこむ` : undefined}
          className="flex w-full items-end justify-center gap-0.5 disabled:cursor-default"
        >
          <span className="text-[5.5rem] leading-none font-black tabular-nums">{wholePart}</span>
          <span className="pb-2 text-4xl leading-none font-black">.</span>
          <span className="text-[4.5rem] leading-none font-black tabular-nums">{decimalPart}</span>
          <span className="pb-3 pl-1.5 text-3xl leading-none font-black text-cheek-deep">℃</span>
        </button>
      )}

      {editable && !isEditing && (
        <p className="mt-1 text-center text-[10px] font-bold text-ink-soft">
          数字をタップすると 打ちこめます
        </p>
      )}
    </div>
  )
}

export default TemperatureDisplay
