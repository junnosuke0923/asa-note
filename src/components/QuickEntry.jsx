import { X } from 'lucide-react'
import { formatLong, shiftKey, todayKey } from '../lib/dateUtils'
import Icon from './Icon'

/*
 * まとめて入力。
 *
 * 「1〜2週間ぶんをまとめて書きたい」という声が多い機能。
 * 日をひらいて閉じてを繰り返さずに、一覧のまま数字だけ埋められるようにする。
 * 紙の基礎体温表を書き写すときにも使う。
 */

const DAYS = 14

function QuickEntry({ records, onPatchRecord, onClose }) {
  const today = todayKey()
  const keys = []
  for (let i = 0; i < DAYS; i += 1) keys.push(shiftKey(today, -i))

  const filled = keys.filter((k) => records[k]?.temperature != null).length

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-warm-yellow">
      <div className="ink-line shrink-0 border-t-0 border-r-0 border-l-0 bg-paper px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-hand text-lg font-bold">まとめて入力</p>
            <p className="text-[10px] font-bold text-ink-soft">
              直近{DAYS}日のうち {filled}日 ぶん 入っています
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="とじる"
            className="ink-line blob-b sticker-shadow flex size-9 items-center justify-center bg-cheek active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-md flex-col gap-1.5 px-4 py-4">
          {keys.map((key) => {
            const record = records[key]
            const hasTemp = record?.temperature != null

            return (
              <div
                key={key}
                className={`ink-line blob-b flex items-center gap-2 px-3 py-2 ${
                  hasTemp ? 'bg-paper' : 'border-dashed bg-paper/60'
                } ${record?.period ? 'bg-cheek/40' : ''}`}
              >
                <span className="w-24 shrink-0 text-xs font-black text-ink-soft">
                  {formatLong(key)}
                </span>

                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="35"
                  max="38.5"
                  value={record?.temperature ?? ''}
                  placeholder="—"
                  aria-label={`${formatLong(key)}の体温`}
                  onChange={(e) =>
                    onPatchRecord(key, {
                      temperature: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                  className="ink-line blob-b w-24 bg-warm-yellow px-2 py-1 text-center text-sm font-black tabular-nums outline-none focus:bg-paper"
                />

                <button
                  type="button"
                  aria-pressed={record?.period === true}
                  aria-label={`${formatLong(key)}を 生理中にする`}
                  onClick={() => onPatchRecord(key, { period: !record?.period })}
                  className={`ink-line blob-pill ml-auto flex items-center px-2.5 py-1.5 transition ${
                    record?.period ? 'bg-cheek sticker-shadow' : 'bg-paper opacity-45'
                  }`}
                >
                  <Icon name="drop" size={15} />
                </button>
              </div>
            )
          })}

          <p className="pt-1 pb-2 text-center text-[10px] font-bold text-ink-soft">
            書いたそばから保存されます
          </p>
        </div>
      </div>
    </div>
  )
}

export default QuickEntry
