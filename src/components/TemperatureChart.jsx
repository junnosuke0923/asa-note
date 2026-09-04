import { useState } from 'react'
import { formatLong, formatShort, shiftKey, todayKey } from '../lib/dateUtils'
import { getCyclePhases, getPeriodStarts } from '../lib/cycle'
import { HIGH_TEMP_THRESHOLD } from '../lib/temperature'
import { buildBands, buildMarkerLanes, getUnwellDays } from '../lib/chartMarkers'
import { TAGS } from '../lib/tags'
import AppImage from './AppImage'
import Icon from './Icon'
import Sprout from './Sprout'

/*
 * 体温グラフ。
 *
 * 基礎体温表は「生理がいつ来たか」と重ねて読むもの。
 * 体温の線だけでは判断できないので、月経の帯と、
 * 低温期→高温期に切り替わった位置をいっしょに描く。
 *
 * 高温／低温の色分けは 36.7℃ の固定線ではなく、
 * その人自身の低温期の平均から求めた切替点を使う。
 * 体温の高さには個人差があるため。
 *
 * 線の下には「しるしの帯」を並べる。おくすり・つういん などは
 * 体温と見くらべてはじめて意味を持つので、タップしないと見えない
 * 状態では記録する意味がない（chartMarkers.js に理由を書いた）。
 */

/*
 * 横幅は「実際に画面へ出る大きさ」に合わせてある。
 *
 * ここが合っていないと、SVG は viewBox ごと拡大縮小されるため、
 * fontSize に書いた数字と 実際に見える文字の大きさがズレる。
 * 以前は 340 で描いて 283px の枠に入れていたので、
 * すべての文字が 17% 小さく表示されていた。
 * まわりの文字とくらべて グラフの中だけ読みにくかったのは これが原因。
 *
 * スマホ幅（390px）のとき、カードの内側は およそ 296px。
 * ここを 296 にしておけば、fontSize 10 は だいたい 10px で出る。
 */
const VIEW_W = 296

/*
 * 左の余白は 目盛りの数字（「36.2」）が収まるぶんだけ。
 *
 * 一度は しるしの行の名前を ここに文字で書いたが、
 * 4文字ぶんの列は 横幅の2割を食う。折れ線を見るための
 * 場所が そのぶん狭くなるので、名前はグラフの外に出した。
 * 行の見分けは 大きめのアイコンと、下の1行の凡例でつける。
 */
const MARGIN = { top: 14, right: 6, left: 32 }
const PLOT_W = VIEW_W - MARGIN.left - MARGIN.right
const PLOT_H = 150

/** しるしの行 1本ぶんの高さと、帯の太さの半分 */
const LANE_H = 18
const BAR_R = 4.5

const RANGES = [
  { id: 'cycle', label: 'この周期' },
  { id: '30', label: '30日' },
  { id: '90', label: '90日' },
]

function buildYDomain(values) {
  let lo = Math.min(...values) - 0.12
  let hi = Math.max(...values) + 0.12

  // わずかな上下が大げさに見えないよう、最低でも0.8℃ぶんの幅を確保する
  const span = hi - lo
  if (span < 0.8) {
    const pad = (0.8 - span) / 2
    lo -= pad
    hi += pad
  }
  return { lo, hi }
}

function buildTicks(lo, hi) {
  const ticks = []
  for (let v = Math.ceil(lo / 0.2) * 0.2; v <= hi + 1e-9; v += 0.2) {
    ticks.push(Math.round(v * 100) / 100)
  }
  return ticks
}

function EmptyChart({ image }) {
  return (
    <div className="ink-line blob-a sticker-shadow flex flex-col items-center gap-3 bg-paper px-6 py-10 text-center">
      <AppImage
        src={image}
        size={132}
        className="animate-fuwa"
        fallback={<Sprout size={108} className="animate-fuwa" />}
      />
      <p className="font-hand text-base font-bold">まだ なにも ないヨ</p>
      <p className="text-xs leading-relaxed text-ink-soft">
        きろくすると ここに グラフが出るよ。
        <br />
        3日ぶんくらいから 形が見えてくる
      </p>
    </div>
  )
}

/** 表示する日付の範囲を決める */
function resolveRange(records, rangeId) {
  const end = todayKey()

  if (rangeId === 'cycle') {
    const starts = getPeriodStarts(records)
    const currentStart = [...starts].reverse().find((s) => s <= end)
    if (currentStart) return { start: currentStart, end, byCycle: true }
    // 生理の記録がまだ無いときは30日にしておく
    return { start: shiftKey(end, -29), end, byCycle: false }
  }

  return { start: shiftKey(end, -(Number(rangeId) - 1)), end, byCycle: false }
}

function TemperatureChart({ records, treatments = {}, image }) {
  const [rangeId, setRangeId] = useState('cycle')
  const [selected, setSelected] = useState(null)

  const { start, end, byCycle } = resolveRange(records, rangeId)

  const dayKeys = []
  for (let key = start; key <= end; key = shiftKey(key, 1)) dayKeys.push(key)

  const points = dayKeys
    .map((key, index) => ({ key, index, temperature: records[key]?.temperature }))
    .filter((p) => typeof p.temperature === 'number')

  if (points.length === 0) return <EmptyChart image={image} />

  const { lo, hi } = buildYDomain(points.map((p) => p.temperature))
  const xFor = (i) => MARGIN.left + (dayKeys.length <= 1 ? 0 : (i / (dayKeys.length - 1)) * PLOT_W)
  const yFor = (v) => MARGIN.top + (1 - (v - lo) / (hi - lo)) * PLOT_H

  // この期間に当てはまる「低温期→高温期の切替」を探す
  const phase = getCyclePhases(records).find((c) => c.phase && c.start >= start && c.start <= end)
    ?.phase
  const shiftIndex = phase ? dayKeys.indexOf(phase.shiftKey) : -1
  const boundary = phase ? phase.lowAvg + 0.3 : HIGH_TEMP_THRESHOLD

  // 月経の帯（連続している日をまとめて1本の帯にする）
  const bands = buildBands(dayKeys, (key) => records[key]?.period === true)

  // 線の下に並べる しるしの帯。記録が1つも無い種類は行ごと出さない
  const lanes = buildMarkerLanes(dayKeys, records, treatments)
  const unwellDays = getUnwellDays(dayKeys, records)

  // 目盛りの下から しるしの帯、そのさらに下に日付という順に積む
  const plotBottom = MARGIN.top + PLOT_H
  const laneTop = plotBottom + 6
  const axisY = laneTop + lanes.length * LANE_H
  const viewH = axisY + 28

  const ticks = buildTicks(lo, hi)
  const labelStep = Math.max(1, Math.ceil(dayKeys.length / 5))

  return (
    <div className="ink-line blob-a sticker-shadow bg-paper px-2 pt-3 pb-2">
      {/* 期間の切り替え */}
      <div className="mb-2 flex gap-1.5">
        {RANGES.map((range) => (
          <button
            key={range.id}
            type="button"
            aria-pressed={rangeId === range.id}
            onClick={() => {
              setRangeId(range.id)
              setSelected(null)
            }}
            className={`ink-line blob-pill flex-1 py-1 text-[11px] font-black transition ${
              rangeId === range.id ? 'bg-cheek sticker-shadow' : 'bg-paper text-ink-soft'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${VIEW_W} ${viewH}`}
        className="h-auto w-full touch-manipulation"
        role="img"
        aria-label={`${formatShort(start)}から${formatShort(end)}までの基礎体温グラフ。記録${points.length}日ぶん。線の下に${lanes.map((lane) => lane.label).join('・')}のしるし`}
      >
        {/* 月経の帯。しるしの帯のところまで通して、縦の位置を見くらべられるようにする */}
        {bands.map((band) => (
          <rect
            key={band.startIndex}
            x={xFor(band.startIndex) - 2}
            y={MARGIN.top}
            width={Math.max(4, xFor(band.endIndex) - xFor(band.startIndex) + 4)}
            height={axisY - MARGIN.top}
            fill="var(--color-cheek)"
            opacity="0.45"
          />
        ))}

        {/* 高温期側のうっすらした帯 */}
        {boundary > lo && boundary < hi && (
          <rect
            x={MARGIN.left}
            y={MARGIN.top}
            width={PLOT_W}
            height={Math.max(0, yFor(boundary) - MARGIN.top)}
            fill="var(--color-cheek)"
            opacity="0.16"
          />
        )}

        {/* 横の目盛り */}
        {ticks.map((v) => (
          <g key={v}>
            <line
              x1={MARGIN.left}
              y1={yFor(v)}
              x2={MARGIN.left + PLOT_W}
              y2={yFor(v)}
              stroke="var(--color-ink)"
              strokeWidth="1"
              opacity="0.1"
            />
            <text
              x={MARGIN.left - 5}
              y={yFor(v) + 3.2}
              textAnchor="end"
              fontSize="10.5"
              fontWeight="800"
              fill="var(--color-ink-soft)"
            >
              {v.toFixed(1)}
            </text>
          </g>
        ))}

        {/* 低温期と高温期の境目 */}
        {boundary > lo && boundary < hi && (
          <line
            x1={MARGIN.left}
            y1={yFor(boundary)}
            x2={MARGIN.left + PLOT_W}
            y2={yFor(boundary)}
            stroke="var(--color-cheek-deep)"
            strokeWidth="1.6"
            strokeDasharray="5 4"
          />
        )}

        {/* 高温期に入った位置の縦線 */}
        {shiftIndex >= 0 && (
          <g>
            <line
              x1={xFor(shiftIndex)}
              y1={MARGIN.top}
              x2={xFor(shiftIndex)}
              y2={MARGIN.top + PLOT_H}
              stroke="var(--color-grass-deep)"
              strokeWidth="1.8"
              strokeDasharray="3 3"
            />
            <text
              x={xFor(shiftIndex)}
              y={MARGIN.top - 4}
              textAnchor="middle"
              fontSize="10"
              fontWeight="900"
              fill="var(--color-grass-deep)"
            >
              高温期へ
            </text>
          </g>
        )}

        {/* 折れ線。記録が飛んでいるところは点線にする */}
        {points.slice(0, -1).map((a, i) => {
          const b = points[i + 1]
          const isGap = b.index - a.index !== 1
          const high = a.temperature >= boundary
          return (
            <line
              key={a.key}
              x1={xFor(a.index)}
              y1={yFor(a.temperature)}
              x2={xFor(b.index)}
              y2={yFor(b.temperature)}
              stroke={high ? 'var(--color-cheek-deep)' : 'var(--color-hachi-deep)'}
              strokeWidth={isGap ? 1.6 : 2.6}
              strokeLinecap="round"
              strokeDasharray={isGap ? '3 4' : undefined}
              opacity={isGap ? 0.45 : 1}
            />
          )
        })}

        {/*
          しんどかった日の点は丸で囲む。
          風邪や寝不足でも体温は動くので、この日の山や谷は
          「体のリズムではない かもしれない」と分かるようにしておく
        */}
        {points
          .filter((p) => unwellDays.has(p.key))
          .map((p) => (
            <circle
              key={p.key}
              cx={xFor(p.index)}
              cy={yFor(p.temperature)}
              r="6.4"
              fill="none"
              stroke="var(--color-hachi-deep)"
              strokeWidth="1.6"
              strokeDasharray="2.6 2.4"
            />
          ))}

        {/* 点。タップすると下に details が出る */}
        {points.map((p) => (
          <circle
            key={p.key}
            cx={xFor(p.index)}
            cy={yFor(p.temperature)}
            r={selected === p.key ? 5 : 3}
            fill={
              selected === p.key
                ? 'var(--color-usagi)'
                : p.temperature >= boundary
                  ? 'var(--color-cheek)'
                  : 'var(--color-hachi)'
            }
            stroke="var(--color-ink)"
            strokeWidth="1.6"
            onClick={() => setSelected(selected === p.key ? null : p.key)}
            style={{ cursor: 'pointer' }}
          />
        ))}

        {/*
          しるしの行。
          行ごとに うすい下地を敷いて、どこまでが同じ行かを見せる。
          これが無いと、ただ点が散らばっているようにしか見えない。
          左のアイコンは 迷わない大きさまで上げてある。
        */}
        {lanes.map((lane, laneIndex) => {
          const top = laneTop + laneIndex * LANE_H
          const cy = top + LANE_H / 2
          return (
            <g key={lane.id}>
              {/* 1行おきに下地。どこからどこまでが同じ行かを見せる */}
              <rect
                x={MARGIN.left}
                y={top + 1}
                width={PLOT_W}
                height={LANE_H - 2}
                rx="4"
                fill="var(--color-ink)"
                opacity={laneIndex % 2 === 0 ? 0.07 : 0.03}
              />
              <g transform={`translate(${(MARGIN.left - 6 - 17) / 2}, ${cy - 8.5})`}>
                <Icon name={lane.icon} size={17} title={lane.label} />
              </g>
              {lane.bands.map((band) => (
                <rect
                  key={band.startIndex}
                  x={xFor(band.startIndex) - BAR_R}
                  y={cy - BAR_R}
                  width={xFor(band.endIndex) - xFor(band.startIndex) + BAR_R * 2}
                  height={BAR_R * 2}
                  rx={BAR_R}
                  fill={lane.color}
                  stroke="var(--color-ink)"
                  strokeWidth="1.3"
                />
              ))}
            </g>
          )
        })}

        {/* 下の日付。周期表示のときは「◯日目」 */}
        {dayKeys.map((key, i) =>
          i % labelStep === 0 || i === dayKeys.length - 1 ? (
            <text
              key={key}
              x={xFor(i)}
              y={axisY + 11}
              textAnchor="middle"
              fontSize="10.5"
              fontWeight="800"
              fill="var(--color-ink-soft)"
            >
              {byCycle ? i + 1 : formatShort(key)}
            </text>
          ) : null,
        )}

        {byCycle && (
          <text
            x={MARGIN.left + PLOT_W / 2}
            y={axisY + 24}
            textAnchor="middle"
            fontSize="10"
            fontWeight="800"
            fill="var(--color-ink-soft)"
          >
            周期何日目
          </text>
        )}
      </svg>

      {/* 選んだ点の中身 */}
      {selected && records[selected] && (
        <div className="ink-line blob-b mt-1.5 bg-warm-yellow px-3 py-2">
          <p className="text-sm font-black">
            {formatLong(selected)}　{records[selected].temperature.toFixed(2)}℃
            {records[selected].time && (
              <span className="pl-1.5 text-[11px] text-ink-soft">{records[selected].time}</span>
            )}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-bold text-ink-soft">
            {records[selected].period && (
              <span className="flex items-center gap-1">
                <Icon name="drop" size={14} />
                生理
              </span>
            )}
            {records[selected].intimacy && <Icon name="heart" size={14} />}
            {TAGS.filter((tag) => records[selected].tags.includes(tag.id)).map((tag) => (
              <span key={tag.id} className="flex items-center gap-1">
                <Icon name={tag.icon} size={14} />
                {tag.label}
              </span>
            ))}
            {records[selected].memo && <span>{records[selected].memo}</span>}
            {!records[selected].period &&
              !records[selected].intimacy &&
              records[selected].tags.length === 0 &&
              !records[selected].memo && <span>メモなし</span>}
          </div>
        </div>
      )}

      {/*
        凡例。
        しるしの行の名前は グラフの中に書いたので、ここには出さない。
        小さい字を何行も並べると、かえって どれも読まれなくなる。
      */}
      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-bold text-ink-soft">
        <span className="flex items-center gap-1">
          <span className="ink-line inline-block size-3 rounded-full border-2 bg-cheek" />
          高温期
        </span>
        <span className="flex items-center gap-1">
          <span className="ink-line inline-block size-3 rounded-full border-2 bg-hachi" />
          低温期
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3.5 w-2.5 rounded-sm bg-cheek opacity-60" />
          生理
        </span>
      </div>

      {/*
        しるしの行の名前。グラフの中に書くと幅を食うので、ここに1行だけ。
        「しんどい」だけは、まわりに点線を足してある。同じ点線がグラフの
        点にも付くので、この形が「体温が乱れたかも」の目印だと1つで伝わる。
        以前は アイコンをもう1つ並べたり、長い文章を添えたりしていたが、
        印が2つあるように見えたり、字が多すぎたりして かえって読まれなかった。
      */}
      {lanes.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] font-bold text-ink-soft">
          {lanes.map((lane) => (
            <span key={lane.id} className="flex items-center gap-1">
              <span
                className={
                  lane.id === 'unwell' && unwellDays.size > 0
                    ? 'flex size-[19px] items-center justify-center rounded-full border-2 border-dashed border-hachi-deep'
                    : ''
                }
              >
                <Icon name={lane.icon} size={15} />
              </span>
              {lane.label}
            </span>
          ))}
        </div>
      )}

      <p className="mt-1 text-center text-[10.5px] font-bold text-ink-soft">
        高温期と低温期の境目は <span className="text-ink">{boundary.toFixed(2)}℃</span>
        {phase && <span className="block">あなたの低温期の平均から 自動で計算しています</span>}
      </p>
    </div>
  )
}

export default TemperatureChart
