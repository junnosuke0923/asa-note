import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import {
  buildMonthGrid,
  dayOfKey,
  formatMonth,
  shiftMonth,
  todayKey,
  WEEKDAYS,
} from '../lib/dateUtils'
import { getCurrentCycleDay, getPredictions } from '../lib/cycle'
import { HIGH_TEMP_THRESHOLD } from '../lib/temperature'
import AppImage from './AppImage'
import Icon from './Icon'
import Sprout from './Sprout'

function DayCell({ dateKey, record, treatment, isToday, prediction }) {
  if (!dateKey) return <div />

  const day = dayOfKey(dateKey)
  const weekday = new Date(`${dateKey}T00:00:00`).getDay()
  const temperature = record?.temperature ?? null
  const isHigh = temperature !== null && temperature >= HIGH_TEMP_THRESHOLD

  const isPredictedPeriod = prediction === 'period'
  const isPredictedOvulation = prediction === 'ovulation'

  // 並びは 記録画面のスタンプ、そしてグラフの しるしの行と そろえる
  const tags = record?.tags ?? []
  const marks = [
    (tags.includes('medicine') ||
      treatment?.meds?.trim() ||
      treatment?.injection?.trim()) &&
      'pill',
    (tags.includes('hospital') || treatment?.visited) && 'clinic',
    tags.includes('unwell') && 'unwell',
    record?.intimacy && 'heart',
    record?.memo?.trim() && 'note',
  ].filter(Boolean)

  return (
    <div
      className={`relative flex h-14 flex-col items-center justify-start gap-0.5 rounded-xl pt-1 ${
        record?.period ? 'bg-cheek/55' : ''
      } ${isToday ? 'ink-line' : ''} ${
        isPredictedPeriod ? 'border-2 border-dashed border-cheek-deep/70' : ''
      } ${isPredictedOvulation ? 'border-2 border-dashed border-grass-deep/70' : ''}`}
    >
      <span
        className={`text-[11px] leading-none font-black ${
          weekday === 0 ? 'text-cheek-deep' : weekday === 6 ? 'text-hachi-deep' : 'text-ink-soft'
        }`}
      >
        {day}
      </span>

      {temperature !== null ? (
        <span
          className={`text-[10px] leading-none font-black tabular-nums ${
            isHigh ? 'text-cheek-deep' : 'text-hachi-deep'
          }`}
        >
          {temperature.toFixed(2).slice(1)}
        </span>
      ) : (
        <span className="text-[10px] leading-none text-ink-soft/40">·</span>
      )}

      {/*
        1マスは狭いので、しるしは横1列に4つまで。
        あふれたときはメモから落とす。メモは日を開けば必ず読めるが、
        しんどい・通院・薬は ならびで見くらべることに意味があるため
      */}
      <span className="flex items-center gap-px">
        {marks.slice(0, 4).map((name) => (
          <Icon key={name} name={name} size={9} />
        ))}
      </span>
    </div>
  )
}

function Legend() {
  return (
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] font-bold text-ink-soft">
      <span className="flex items-center gap-1">
        <span className="size-3 rounded bg-cheek/55" />
        月経
      </span>
      <span className="flex items-center gap-1">
        <span className="size-3 rounded border-2 border-dashed border-cheek-deep/70" />
        次の月経（目安）
      </span>
      <span className="flex items-center gap-1">
        <span className="size-3 rounded border-2 border-dashed border-grass-deep/70" />
        排卵（目安）
      </span>
      <span className="flex items-center gap-1">
        <Icon name="pill" size={11} />
        おくすり
      </span>
      <span className="flex items-center gap-1">
        <Icon name="clinic" size={11} />
        つういん
      </span>
      <span className="flex items-center gap-1">
        <Icon name="unwell" size={11} />
        しんどい
      </span>
      <span className="flex items-center gap-1">
        <Icon name="heart" size={11} />
        なかよし
      </span>
      <span className="flex items-center gap-1">
        <Icon name="note" size={11} />
        メモ
      </span>
    </div>
  )
}

function CalendarView({ records, treatments, onSelectDay, onQuickEntry, image }) {
  const today = todayKey()
  const [view, setView] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  })

  const cells = buildMonthGrid(view.year, view.month)
  const predictions = getPredictions(records)
  const cycle = getCurrentCycleDay(records)

  const predictionFor = (dateKey) => {
    if (!predictions || !dateKey) return null
    if (dateKey === predictions.nextPeriod) return 'period'
    if (dateKey === predictions.ovulation) return 'ovulation'
    return null
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 py-5">
      {/* 月の切り替え */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="前の月"
          onClick={() => setView((v) => shiftMonth(v.year, v.month, -1))}
          className="ink-line blob-b sticker-shadow flex size-10 items-center justify-center bg-paper active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
        >
          <ChevronLeft size={22} strokeWidth={3} />
        </button>

        <div className="flex items-center gap-1.5">
          <AppImage
            src={image}
            size={30}
            className="animate-fuwa"
            fallback={<Sprout size={26} className="animate-fuwa" />}
          />
          <h1 className="font-hand text-xl font-bold">{formatMonth(view.year, view.month)}</h1>
        </div>

        <button
          type="button"
          aria-label="次の月"
          onClick={() => setView((v) => shiftMonth(v.year, v.month, 1))}
          className="ink-line blob-b sticker-shadow flex size-10 items-center justify-center bg-paper active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
        >
          <ChevronRight size={22} strokeWidth={3} />
        </button>
      </div>

      {cycle && (
        <p className="text-center text-xs font-black text-ink-soft">
          いまは 周期 {cycle.day}日目
        </p>
      )}

      {/* 升目 */}
      <div className="ink-line blob-a sticker-shadow bg-paper px-2 py-3">
        <div className="grid grid-cols-7 gap-0.5">
          {WEEKDAYS.map((label, i) => (
            <div
              key={label}
              className={`pb-1 text-center text-[10px] font-black ${
                i === 0 ? 'text-cheek-deep' : i === 6 ? 'text-hachi-deep' : 'text-ink-soft'
              }`}
            >
              {label}
            </div>
          ))}

          {cells.map((dateKey, i) =>
            dateKey ? (
              <button
                key={dateKey}
                type="button"
                onClick={() => onSelectDay(dateKey)}
                aria-label={`${dayOfKey(dateKey)}日の記録をひらく`}
                className="transition active:scale-95"
              >
                <DayCell
                  dateKey={dateKey}
                  record={records[dateKey]}
                  treatment={treatments[dateKey]}
                  isToday={dateKey === today}
                  prediction={predictionFor(dateKey)}
                />
              </button>
            ) : (
              <div key={`blank-${i}`} />
            ),
          )}
        </div>
      </div>

      <Legend />

      <button
        type="button"
        onClick={onQuickEntry}
        className="ink-line blob-b sticker-shadow flex items-center justify-center gap-1.5 bg-usagi py-2.5 text-sm font-black active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
      >
        <Icon name="pencil" size={18} />
        まとめて入力（直近14日）
      </button>

      <p className="text-center text-[10px] font-bold text-ink-soft">
        日をタップすると、その日の記録を つけたり なおしたり できます
      </p>
    </div>
  )
}

export default CalendarView
