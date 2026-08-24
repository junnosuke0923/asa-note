import { ChevronDown, ChevronUp } from 'lucide-react'

const MIN_CENTS = 3500 // 35.00℃
const MAX_CENTS = 4200 // 42.00℃

function StepButton({ direction, onClick, label, tone }) {
  const Icon = direction === 'up' ? ChevronUp : ChevronDown
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`ink-line blob-b sticker-shadow flex h-16 w-20 items-center justify-center transition active:translate-x-[3px] active:translate-y-[4px] active:shadow-none ${tone}`}
    >
      <Icon size={32} strokeWidth={3.5} />
    </button>
  )
}

function StepperColumn({ label, tone, onUp, onDown, upLabel, downLabel }) {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <StepButton direction="up" label={upLabel} onClick={onUp} tone={tone} />
      <span className="text-sm font-bold text-ink-soft">{label}</span>
      <StepButton direction="down" label={downLabel} onClick={onDown} tone={tone} />
    </div>
  )
}

function TemperatureStepper({ value, onChange }) {
  const cents = Math.round(value * 100)

  const clampAndEmit = (nextCents) => {
    const clamped = Math.min(MAX_CENTS, Math.max(MIN_CENTS, nextCents))
    onChange(clamped / 100)
  }

  return (
    <div className="flex justify-center gap-7">
      <StepperColumn
        label="0.1 ずつ"
        tone="bg-usagi"
        upLabel="0.1度あげる"
        downLabel="0.1度さげる"
        onUp={() => clampAndEmit(cents + 10)}
        onDown={() => clampAndEmit(cents - 10)}
      />
      <StepperColumn
        label="0.01 ずつ"
        tone="bg-hachi"
        upLabel="0.01度あげる"
        downLabel="0.01度さげる"
        onUp={() => clampAndEmit(cents + 1)}
        onDown={() => clampAndEmit(cents - 1)}
      />
    </div>
  )
}

export default TemperatureStepper
