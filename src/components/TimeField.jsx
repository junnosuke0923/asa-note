import Icon from './Icon'

/*
 * 測った時刻。
 *
 * 基礎体温は「起きてすぐ、毎日おなじ時刻に」測るのが前提。
 * 時刻が残っていないと、グラフが乱れたときに
 * 「体調のせい」なのか「測った時刻がずれただけ」なのか区別できない。
 * 診察で見せるときにも効くので、体温とセットで持っておく。
 */
function TimeField({ value, onChange, hint }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Icon name="calendar" size={15} />
      <span className="text-xs font-black text-ink-soft">はかった時刻</span>

      <input
        type="time"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
        aria-label="はかった時刻"
        className="ink-line blob-b bg-paper px-2 py-1 text-sm font-black tabular-nums outline-none"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="時刻を けす"
          className="text-[10px] font-black text-ink-soft underline"
        >
          けす
        </button>
      )}

      {hint && <span className="text-[10px] font-bold text-cheek-deep">{hint}</span>}
    </div>
  )
}

export default TimeField
