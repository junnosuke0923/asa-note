import { formatLong } from '../lib/dateUtils'
import { withTemperature } from '../lib/records'
import { calcPhaseInfo } from '../lib/temperature'
import { TAGS } from '../lib/tags'
import CycleStats from './CycleStats'
import AppImage from './AppImage'
import Icon from './Icon'
import Sprout from './Sprout'
import TemperatureChart from './TemperatureChart'

function ChartView({ records, treatments = {}, image, headerImage }) {
  const phase = calcPhaseInfo(records)

  // 一覧に出すのは、体温が入っている日だけ。
  // グラフには全部わたす。通院した日など、体温が無くても
  // しるしの帯には出したいものがあるため
  const tempRecords = withTemperature(records)

  // 新しい順に、直近7件だけ一覧に出す
  const recentKeys = Object.keys(tempRecords).sort().reverse().slice(0, 7)

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-5 py-5">
      <h1 className="flex items-center justify-center gap-1.5 font-hand text-xl font-bold">
        <AppImage
          src={headerImage}
          size={44}
          className="animate-fuwa"
          fallback={<Sprout size={38} className="animate-fuwa" />}
        />
        体温のグラフ
      </h1>

      {phase && (
        <div
          className={`ink-line blob-a sticker-shadow px-5 py-3 text-center ${
            phase.high ? 'bg-cheek' : 'bg-hachi'
          }`}
        >
          <p className="text-lg font-black">
            {phase.high ? '高温期' : '低温期'} {phase.days}日目
          </p>
          <p className="text-[11px] font-bold text-ink-soft">
            さいごの きろく: {formatLong(phase.latestKey)}
          </p>
        </div>
      )}

      <TemperatureChart records={records} treatments={treatments} image={image} />

      <CycleStats records={records} />

      {recentKeys.length > 0 && (
        <div className="ink-line blob-a sticker-shadow bg-paper px-4 py-3">
          <p className="mb-2 text-center text-xs font-black text-ink-soft">さいきんの きろく</p>
          <ul className="flex flex-col gap-1">
            {recentKeys.map((key) => {
              const record = records[key]
              return (
                <li
                  key={key}
                  className="flex items-center gap-2 border-b border-dashed border-ink/15 py-1.5 last:border-b-0"
                >
                  <span className="w-28 text-xs font-bold text-ink-soft">{formatLong(key)}</span>
                  <span className="flex-1 text-sm font-black tabular-nums">
                    {record.temperature.toFixed(2)}℃
                  </span>
                  <span className="flex items-center gap-1">
                    {TAGS.filter((tag) => (record.tags ?? []).includes(tag.id)).map((tag) => (
                      <Icon key={tag.id} name={tag.icon} size={14} />
                    ))}
                    {record.period && <Icon name="drop" size={14} />}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

export default ChartView
