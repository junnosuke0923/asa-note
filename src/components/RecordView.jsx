import { Minus, Plus } from 'lucide-react'
import { formatLong, shiftKey, todayKey } from '../lib/dateUtils'
import AppImage from './AppImage'
import Icon from './Icon'
import RecordButton from './RecordButton'
import Sprout from './Sprout'
import StampTagSelector from './StampTagSelector'
import TemperatureDisplay from './TemperatureDisplay'
import TemperatureRuler from './TemperatureRuler'
import TimeField from './TimeField'

const MIN_CENTS = 3500
const MAX_CENTS = 3850

function NudgeButton({ delta, onNudge, label }) {
  const Icon = delta > 0 ? Plus : Minus
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => onNudge(delta)}
      className="ink-line blob-b sticker-shadow flex size-12 shrink-0 items-center justify-center bg-usagi transition active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
    >
      <Icon size={24} strokeWidth={3.5} />
    </button>
  )
}

function RecordView({
  temperature,
  onTemperatureChange,
  selectedTagIds,
  onToggleTag,
  onRecord,
  isBumping,
  alreadyRecorded,
  streak,
  targetKey,
  onTargetKeyChange,
  yesterdayMissing,
  onShare,
  image,
  time,
  onTimeChange,
  onGoToCalendar,
}) {
  const nudge = (deltaCents) => {
    const next = Math.round(temperature * 100) + deltaCents
    onTemperatureChange(Math.min(MAX_CENTS, Math.max(MIN_CENTS, next)) / 100)
  }

  const isToday = targetKey === todayKey()

  /*
   * すき間が gap-3 なのは、そのぶんを 上の絵の大きさに回しているため。
   * 画面の高さは決まっているので、絵を大きくした ぶんだけ どこかを詰める。
   *
   * 縦の余りかたは、端末の高さによって ずいぶん変わる。
   * 中央ぞろえにすると 上が空きすぎ、1か所にまとめると
   * そこだけ ぽっかり空いて見えた。
   * そこで 余りを3か所に 1:2:2 で分けて、
   * どこか1か所だけが目立って空くことがないようにしている。
   */
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-5 py-5">
      <div className="min-h-0 flex-[1]" aria-hidden="true" />

      <header className="flex flex-col items-center gap-1">
        <AppImage
          src={image}
          size={84}
          className="animate-fuwa"
          fallback={<Sprout size={72} className="animate-fuwa" />}
        />
        <p className="text-sm font-bold text-ink-soft">{formatLong(targetKey)}</p>
        <h1 className="font-hand text-xl font-bold">
          {alreadyRecorded ? 'もう つけたネ' : 'きょうの体温、はかった？'}
        </h1>
        {streak > 0 && (
          <p className="flex items-center gap-1 text-xs font-black text-ink-soft">
            <Icon name="sprout" size={15} />
            {streak}日 つづいてるよ
          </p>
        )}
      </header>

      <TemperatureDisplay
        value={temperature}
        isBumping={isBumping}
        onChange={onTemperatureChange}
      />

      {/* なぞって決める。細かい調整は左右のボタンで */}
      <div className="flex items-center gap-2">
        <NudgeButton delta={-1} onNudge={nudge} label="0.01度さげる" />
        <div className="min-w-0 flex-1">
          <TemperatureRuler value={temperature} onChange={onTemperatureChange} />
        </div>
        <NudgeButton delta={1} onNudge={nudge} label="0.01度あげる" />
      </div>

      <TimeField value={time} onChange={onTimeChange} />

      <StampTagSelector selectedIds={selectedTagIds} onToggle={onToggleTag} />

      {/*
        月経・なかよし・体重・治療の記録は「こよみ」の中にある。
        この画面のスタンプに無いので、知らないと ずっと出会わない。
        目立たせすぎず、1行だけ添えておく
      */}
      <button
        type="button"
        onClick={onGoToCalendar}
        className="flex items-center justify-center gap-1 text-[11px] font-bold text-ink-soft underline decoration-dotted underline-offset-2"
      >
        <Icon name="calendar" size={13} />
        月経・なかよし・体重などは「こよみ」から記録できます
      </button>

      {/* 余った高さの引き受け先。画面が短いときは 0 まで縮む */}
      <div className="min-h-0 flex-[2]" aria-hidden="true" />

      <RecordButton onClick={onRecord} label={alreadyRecorded ? 'なおす' : 'きろく する！'} />

      {alreadyRecorded && (
        <button
          type="button"
          onClick={onShare}
          className="ink-line blob-pill sticker-shadow flex items-center justify-center gap-1.5 bg-grass py-2 text-xs font-black active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
        >
          <Icon name="heart" size={15} />
          パートナーに しらせる
        </button>
      )}

      {/* 前の日をつけ忘れているときだけ出す近道 */}
      {isToday && yesterdayMissing && (
        <button
          type="button"
          onClick={() => onTargetKeyChange(shiftKey(todayKey(), -1))}
          className="ink-line blob-pill sticker-shadow bg-warm-yellow py-2 text-xs font-black active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
        >
          きのう つけ忘れてる？ こっちから つけられるよ
        </button>
      )}

      {!isToday && (
        <button
          type="button"
          onClick={() => onTargetKeyChange(todayKey())}
          className="ink-line blob-pill sticker-shadow bg-hachi py-2 text-xs font-black active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
        >
          きょうに もどる
        </button>
      )}

      <div className="min-h-0 flex-[2]" aria-hidden="true" />
    </div>
  )
}

export default RecordView
