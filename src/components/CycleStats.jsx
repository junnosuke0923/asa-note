import { formatShort } from '../lib/dateUtils'
import { getCycleStats } from '../lib/cycle'

function Stat({ label, value, unit }) {
  return (
    <div className="ink-line blob-b sticker-shadow flex-1 bg-paper px-2 py-2 text-center">
      <p className="text-[10px] font-black text-ink-soft">{label}</p>
      <p className="leading-none font-black">
        <span className="text-xl tabular-nums">{value ?? '—'}</span>
        {value != null && <span className="pl-0.5 text-[10px]">{unit}</span>}
      </p>
    </div>
  )
}

function CycleStats({ records }) {
  const stats = getCycleStats(records)

  // 月経の記録がまだ無いときは、何を書けばいいか案内する
  if (stats.cycleCount === 0) {
    return (
      <div className="ink-line blob-a sticker-shadow bg-warm-yellow px-4 py-3 text-center">
        <p className="text-xs font-black">生理の日を つけると 周期がわかります</p>
        <p className="mt-1 text-[10px] font-bold text-ink-soft">
          「こよみ」で日をタップ → 月経 を オンに
        </p>
      </div>
    )
  }

  const { predictions } = stats

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-2">
        <Stat label="平均の周期" value={stats.averageCycleLength} unit="日" />
        <Stat label="高温期" value={stats.averageHighPhaseDays} unit="日" />
        <Stat
          label="いま"
          value={stats.current ? stats.current.day : null}
          unit="日目"
        />
      </div>

      {stats.shortest != null && stats.shortest !== stats.longest && (
        <p className="text-center text-[10px] font-bold text-ink-soft">
          これまでの幅：{stats.shortest}〜{stats.longest}日
        </p>
      )}

      {predictions ? (
        <div className="ink-line blob-a sticker-shadow bg-warm-yellow px-4 py-3">
          <p className="mb-1.5 text-center text-[11px] font-black text-ink-soft">
            つぎの目安
          </p>
          <div className="flex justify-around text-center">
            <div>
              <p className="text-[10px] font-black text-grass-deep">排卵</p>
              <p className="text-sm font-black">{formatShort(predictions.ovulation)}</p>
              <p className="text-[10px] font-bold text-ink-soft">
                {predictions.daysToOvulation >= 0
                  ? `あと${predictions.daysToOvulation}日`
                  : `${-predictions.daysToOvulation}日前`}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-cheek-deep">生理</p>
              <p className="text-sm font-black">{formatShort(predictions.nextPeriod)}</p>
              <p className="text-[10px] font-bold text-ink-soft">
                {predictions.daysToNextPeriod >= 0
                  ? `あと${predictions.daysToNextPeriod}日`
                  : `${-predictions.daysToNextPeriod}日前`}
              </p>
            </div>
          </div>
          <p className="mt-2 text-center text-[9.5px] font-bold text-ink-soft">
            {predictions.basedOnCycles}周期ぶんの平均から出した目安です。
            <br />
            治療中は 医師の指示が優先されます。
          </p>
        </div>
      ) : (
        <p className="text-center text-[10px] font-bold text-ink-soft">
          あと1周期ぶん記録すると、次の目安が出せます
        </p>
      )}
    </div>
  )
}

export default CycleStats
