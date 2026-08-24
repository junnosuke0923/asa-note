import { X } from 'lucide-react'
import { formatShort, shiftKey, todayKey } from '../lib/dateUtils'
import { getCurrentCycleDay, getCycleStats } from '../lib/cycle'
import { HIGH_TEMP_THRESHOLD } from '../lib/temperature'
import { FLOW_LEVELS } from '../lib/records'

/*
 * 病院に持っていくための表。
 *
 * 画面のポップな装飾は外して、白地に黒線の読みやすい形にする。
 * ブラウザの印刷機能から「PDFとして保存」も選べる。
 */

const DAYS = 90

function buildRange() {
  const end = todayKey()
  const keys = []
  for (let i = DAYS - 1; i >= 0; i -= 1) keys.push(shiftKey(end, -i))
  return keys
}

const TAG_LABEL = { medicine: '薬', hospital: '院', unwell: '不' }

function PrintChart({ keys, records }) {
  const W = 1000
  const H = 260
  const PAD = { top: 12, right: 8, bottom: 22, left: 34 }
  const MIN = 35.9
  const MAX = 37.3

  const x = (i) => PAD.left + (i * (W - PAD.left - PAD.right)) / Math.max(1, keys.length - 1)
  const y = (t) => PAD.top + ((MAX - t) * (H - PAD.top - PAD.bottom)) / (MAX - MIN)

  // 記録が飛んでいるところは線をつなげない
  const segments = []
  let current = []
  keys.forEach((key, i) => {
    const t = records[key]?.temperature
    if (t === null || t === undefined) {
      if (current.length > 1) segments.push(current)
      current = []
    } else {
      current.push(`${x(i)},${y(t)}`)
    }
  })
  if (current.length > 1) segments.push(current)

  const gridTemps = [36.0, 36.3, 36.7, 37.0, 37.3]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 'auto' }}>
      {gridTemps.map((t) => (
        <g key={t}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(t)}
            y2={y(t)}
            stroke={t === HIGH_TEMP_THRESHOLD ? '#888' : '#DDD'}
            strokeWidth="1"
            strokeDasharray={t === HIGH_TEMP_THRESHOLD ? '4 3' : undefined}
          />
          <text x="2" y={y(t) + 3} fontSize="9" fill="#555">
            {t.toFixed(1)}
          </text>
        </g>
      ))}

      {/* 月経の日に縦の帯 */}
      {keys.map((key, i) =>
        records[key]?.period ? (
          <rect
            key={key}
            x={x(i) - 3}
            y={PAD.top}
            width="6"
            height={H - PAD.top - PAD.bottom}
            fill="#000"
            opacity="0.09"
          />
        ) : null,
      )}

      {segments.map((points, i) => (
        <polyline
          key={i}
          points={points.join(' ')}
          fill="none"
          stroke="#222"
          strokeWidth="1.4"
        />
      ))}

      {keys.map((key, i) => {
        const t = records[key]?.temperature
        if (t === null || t === undefined) return null
        return <circle key={key} cx={x(i)} cy={y(t)} r="1.9" fill="#222" />
      })}

      {/* 7日ごとに日付 */}
      {keys.map((key, i) =>
        i % 7 === 0 ? (
          <text key={key} x={x(i)} y={H - 6} fontSize="9" fill="#555" textAnchor="middle">
            {formatShort(key)}
          </text>
        ) : null,
      )}
    </svg>
  )
}

function PrintSheet({ records, treatments, onClose }) {
  const keys = buildRange()
  const stats = getCycleStats(records)
  const cycle = getCurrentCycleDay(records)

  // 何か書いてある日だけ表に出す
  const rows = keys
    .filter((key) => records[key] || treatments[key])
    .reverse()

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white">
      {/* 画面用の操作バー。印刷には出さない */}
      <div className="print:hidden flex shrink-0 items-center justify-between gap-2 border-b-2 border-ink bg-paper px-4 py-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="ink-line blob-b sticker-shadow flex items-center gap-1.5 bg-cheek px-4 py-2 text-sm font-black active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
        >
          印刷 / PDF保存
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="とじる"
          className="ink-line blob-b sticker-shadow flex size-9 items-center justify-center bg-paper active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
        >
          <X size={20} strokeWidth={3} />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="print-sheet mx-auto max-w-[820px] px-5 py-5 text-[#222]">
          <h1 className="mb-1 text-center text-lg font-bold">基礎体温表</h1>
          <p className="mb-3 text-center text-[11px] text-[#555]">
            直近{DAYS}日（{formatShort(keys[0])} 〜 {formatShort(keys[keys.length - 1])}）
            {cycle && ` / 周期 ${cycle.day}日目`}
          </p>

          {/* まとめ */}
          <table className="mb-3 w-full border-collapse text-[11px]">
            <tbody>
              <tr>
                <th className="border border-[#BBB] bg-[#F4F4F4] px-2 py-1 text-left font-bold">
                  平均周期
                </th>
                <td className="border border-[#BBB] px-2 py-1">
                  {stats.averageCycleLength ? `${stats.averageCycleLength}日` : '—'}
                </td>
                <th className="border border-[#BBB] bg-[#F4F4F4] px-2 py-1 text-left font-bold">
                  高温期の平均
                </th>
                <td className="border border-[#BBB] px-2 py-1">
                  {stats.averageHighPhaseDays ? `${stats.averageHighPhaseDays}日` : '—'}
                </td>
                <th className="border border-[#BBB] bg-[#F4F4F4] px-2 py-1 text-left font-bold">
                  最短 / 最長
                </th>
                <td className="border border-[#BBB] px-2 py-1">
                  {stats.shortest ? `${stats.shortest} / ${stats.longest}日` : '—'}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mb-3 border border-[#BBB] p-1">
            <PrintChart keys={keys} records={records} />
          </div>

          {/* 記録の表 */}
          <table className="w-full border-collapse text-[10.5px]">
            <thead>
              <tr>
                {['日付', '時刻', '体温', '月経', '量', '印', '体重', '通院・処置', 'メモ'].map((h) => (
                  <th
                    key={h}
                    className="border border-[#BBB] bg-[#F4F4F4] px-1.5 py-1 text-left font-bold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((key) => {
                const r = records[key]
                const t = treatments[key]
                const flow = FLOW_LEVELS.find((f) => f.id === r?.flow)
                const treatmentText = [t?.clinic, t?.content, t?.meds, t?.injection]
                  .filter(Boolean)
                  .join(' / ')

                return (
                  <tr key={key}>
                    <td className="border border-[#BBB] px-1.5 py-0.5 whitespace-nowrap">
                      {formatShort(key)}
                    </td>
                    <td className="border border-[#BBB] px-1.5 py-0.5 tabular-nums whitespace-nowrap">
                      {r?.time ?? ''}
                    </td>
                    <td className="border border-[#BBB] px-1.5 py-0.5 text-right tabular-nums">
                      {r?.temperature != null ? r.temperature.toFixed(2) : ''}
                    </td>
                    <td className="border border-[#BBB] px-1.5 py-0.5 text-center">
                      {r?.period ? '●' : ''}
                    </td>
                    <td className="border border-[#BBB] px-1.5 py-0.5 text-center">
                      {flow ? '●'.repeat(flow.dots) : ''}
                    </td>
                    <td className="border border-[#BBB] px-1.5 py-0.5 text-center">
                      {(r?.tags ?? []).map((id) => TAG_LABEL[id] ?? '').join('')}
                    </td>
                    <td className="border border-[#BBB] px-1.5 py-0.5 text-right tabular-nums">
                      {r?.weight ?? ''}
                    </td>
                    <td className="border border-[#BBB] px-1.5 py-0.5">{treatmentText}</td>
                    <td className="border border-[#BBB] px-1.5 py-0.5">
                      {[r?.memo, t?.memo].filter(Boolean).join(' / ')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {rows.length === 0 && (
            <p className="py-6 text-center text-xs text-[#777]">まだ記録がありません。</p>
          )}

          <p className="mt-3 text-[9.5px] text-[#777]">
            ※ 平均周期・高温期の日数は、記録の平均から自動で計算した目安です。
          </p>
        </div>
      </div>
    </div>
  )
}

export default PrintSheet
