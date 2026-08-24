import { X } from 'lucide-react'
import { useState } from 'react'
import { formatLong } from '../lib/dateUtils'
import { FLOW_LEVELS } from '../lib/records'
import { HORMONE_FIELDS } from '../lib/treatments'
import Icon from './Icon'
import StampTagSelector from './StampTagSelector'
import TemperatureDisplay from './TemperatureDisplay'
import TemperatureStepper from './TemperatureStepper'
import TimeField from './TimeField'

const DEFAULT_TEMPERATURE = 36.5

/* ── 小さな部品 ─────────────────────────────────────────── */

function Section({ title, children }) {
  return (
    <div className="ink-line blob-a sticker-shadow bg-paper px-4 py-3">
      <p className="mb-2 text-[11px] font-black text-ink-soft">{title}</p>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange, children, tone = 'bg-cheek' }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={`ink-line blob-pill px-4 py-2 text-sm font-black transition active:translate-x-[2px] active:translate-y-[3px] active:shadow-none ${
        checked ? `${tone} sticker-shadow` : 'bg-paper text-ink-soft sticker-shadow'
      }`}
    >
      {children}
    </button>
  )
}

function NumberField({ label, unit, value, onChange, step = 'any', placeholder }) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-xs font-black text-ink-soft">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className="ink-line blob-b w-full bg-warm-yellow px-3 py-1.5 text-sm font-black tabular-nums outline-none focus:bg-paper"
      />
      {unit && <span className="shrink-0 text-[10px] font-black text-ink-soft">{unit}</span>}
    </label>
  )
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-xs font-black text-ink-soft">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="ink-line blob-b w-full bg-warm-yellow px-3 py-1.5 text-sm font-bold outline-none focus:bg-paper"
      />
    </label>
  )
}

/* ── からだの記録 ───────────────────────────────────────── */

function BodyTab({ record, onPatch }) {
  const hasTemperature = record.temperature !== null

  return (
    <>
      <Section title="体温">
        {hasTemperature ? (
          <div className="flex flex-col gap-3">
            <TemperatureDisplay value={record.temperature} isBumping={false} />
            <TemperatureStepper
              value={record.temperature}
              onChange={(v) => onPatch({ temperature: v })}
            />
            <TimeField
              value={record.time}
              onChange={(v) => onPatch({ time: v })}
            />
            <button
              type="button"
              onClick={() => onPatch({ temperature: null })}
              className="text-xs font-black text-ink-soft underline"
            >
              体温を けす
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onPatch({ temperature: DEFAULT_TEMPERATURE })}
            className="ink-line blob-b sticker-shadow w-full bg-warm-yellow py-3 text-sm font-black active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
          >
            ＋ 体温を つける
          </button>
        )}
      </Section>

      <Section title="月経">
        <div className="flex flex-col gap-2">
          <Toggle checked={record.period} onChange={(v) => onPatch({ period: v })}>
            <span className="flex items-center gap-1.5">
              {record.period && <Icon name="drop" size={16} />}
              {record.period ? '生理中' : '生理は きてない'}
            </span>
          </Toggle>

          {record.period && (
            <div className="flex gap-2">
              {FLOW_LEVELS.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  aria-pressed={record.flow === level.id}
                  onClick={() =>
                    onPatch({ flow: record.flow === level.id ? null : level.id })
                  }
                  className={`ink-line blob-pill flex-1 px-2 py-1.5 text-[11px] font-black transition ${
                    record.flow === level.id
                      ? 'bg-cheek sticker-shadow'
                      : 'bg-paper text-ink-soft'
                  }`}
                >
                  {'●'.repeat(level.dots)}
                  <span className="block">{level.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Section>

      <Section title="スタンプ">
        <StampTagSelector
          selectedIds={record.tags}
          onToggle={(tagId) =>
            onPatch({
              tags: record.tags.includes(tagId)
                ? record.tags.filter((id) => id !== tagId)
                : [...record.tags, tagId],
            })
          }
        />
      </Section>

      <Section title="そのほか">
        <div className="flex flex-col gap-2.5">
          <NumberField
            label="体重"
            unit="kg"
            step="0.1"
            value={record.weight}
            onChange={(v) => onPatch({ weight: v })}
            placeholder="—"
          />
          <div className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-xs font-black text-ink-soft">なかよし</span>
            <Toggle checked={record.intimacy} onChange={(v) => onPatch({ intimacy: v })}>
              <span className="flex items-center gap-1.5">
                {record.intimacy && <Icon name="heart" size={16} />}
                {record.intimacy ? 'あり' : 'なし'}
              </span>
            </Toggle>
          </div>
        </div>
      </Section>

      <Section title="メモ">
        <textarea
          rows={3}
          value={record.memo}
          onChange={(e) => onPatch({ memo: e.target.value })}
          placeholder="ねむれなかった、お酒のんだ など"
          className="ink-line blob-b w-full resize-none bg-warm-yellow px-3 py-2 text-sm font-bold outline-none focus:bg-paper"
        />
        <p className="mt-1 text-[10px] font-bold text-ink-soft">
          体温がふだんとちがう理由を残しておくと、あとで読みやすくなります
        </p>
      </Section>
    </>
  )
}

/* ── 治療の記録 ─────────────────────────────────────────── */

function TreatmentTab({ treatment, onPatch }) {
  return (
    <>
      <Section title="通院">
        <div className="flex flex-col gap-2.5">
          <Toggle
            checked={treatment.visited}
            onChange={(v) => onPatch({ visited: v })}
            tone="bg-hachi"
          >
            <span className="flex items-center gap-1.5">
              {treatment.visited && <Icon name="clinic" size={16} />}
              {treatment.visited ? '通院した' : '通院なし'}
            </span>
          </Toggle>
          <TextField
            label="病院"
            value={treatment.clinic}
            onChange={(v) => onPatch({ clinic: v })}
            placeholder="○○クリニック"
          />
          <TextField
            label="内容"
            value={treatment.content}
            onChange={(v) => onPatch({ content: v })}
            placeholder="卵胞チェック、採卵 など"
          />
        </div>
      </Section>

      <Section title="お薬・注射">
        <div className="flex flex-col gap-2.5">
          <TextField
            label="飲み薬"
            value={treatment.meds}
            onChange={(v) => onPatch({ meds: v })}
            placeholder="クロミッド 1錠 など"
          />
          <TextField
            label="注射"
            value={treatment.injection}
            onChange={(v) => onPatch({ injection: v })}
            placeholder="hMG 150単位 など"
          />
        </div>
      </Section>

      <Section title="検査の数値">
        <div className="flex flex-col gap-2.5">
          {HORMONE_FIELDS.map((field) => (
            <NumberField
              key={field.id}
              label={`${field.label}`}
              unit={field.unit}
              value={treatment.hormones[field.id]}
              onChange={(v) => onPatch({ hormones: { [field.id]: v } })}
              placeholder={field.hint}
            />
          ))}
          <NumberField
            label="卵胞 左"
            unit="mm"
            step="0.1"
            value={treatment.follicleL}
            onChange={(v) => onPatch({ follicleL: v })}
          />
          <NumberField
            label="卵胞 右"
            unit="mm"
            step="0.1"
            value={treatment.follicleR}
            onChange={(v) => onPatch({ follicleR: v })}
          />
          <NumberField
            label="内膜"
            unit="mm"
            step="0.1"
            value={treatment.endometrium}
            onChange={(v) => onPatch({ endometrium: v })}
          />
        </div>
      </Section>

      <Section title="かかったお金">
        <NumberField
          label="支払い"
          unit="円"
          step="1"
          value={treatment.cost}
          onChange={(v) => onPatch({ cost: v })}
          placeholder="0"
        />
        <p className="mt-1 text-[10px] font-bold text-ink-soft">
          医療費控除や助成金の申請で、あとから合計を出せます
        </p>
      </Section>

      <Section title="メモ">
        <textarea
          rows={3}
          value={treatment.memo}
          onChange={(e) => onPatch({ memo: e.target.value })}
          placeholder="先生に言われたこと など"
          className="ink-line blob-b w-full resize-none bg-warm-yellow px-3 py-2 text-sm font-bold outline-none focus:bg-paper"
        />
      </Section>
    </>
  )
}

/* ── 本体 ───────────────────────────────────────────────── */

function DayEditor({ dateKey, record, treatment, onPatchRecord, onPatchTreatment, onClose }) {
  const [tab, setTab] = useState('body')

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-warm-yellow">
      {/* 見出し */}
      <div className="ink-line shrink-0 border-t-0 border-r-0 border-l-0 bg-paper px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-hand text-lg font-bold">{formatLong(dateKey)}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="とじる"
            className="ink-line blob-b sticker-shadow flex size-9 items-center justify-center bg-cheek active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <div className="mt-2 flex gap-2">
          {[
            { id: 'body', label: 'からだ', tone: 'bg-cheek' },
            { id: 'treatment', label: 'ちりょう', tone: 'bg-hachi' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={tab === item.id ? 'page' : undefined}
              onClick={() => setTab(item.id)}
              className={`ink-line blob-pill flex-1 py-1.5 text-xs font-black transition ${
                tab === item.id ? `${item.tone} sticker-shadow` : 'bg-paper text-ink-soft'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 中身 */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 py-4">
          {tab === 'body' ? (
            <BodyTab record={record} onPatch={onPatchRecord} />
          ) : (
            <TreatmentTab treatment={treatment} onPatch={onPatchTreatment} />
          )}

          <p className="pb-2 text-center text-[10px] font-bold text-ink-soft">
            書いたそばから保存されます
          </p>
        </div>
      </div>
    </div>
  )
}

export default DayEditor
