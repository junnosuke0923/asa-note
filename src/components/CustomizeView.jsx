import { ImagePlus, Plus, Trash2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import {
  CHEER_GROUPS,
  DECORATION_SLOTS,
  fileToImageData,
} from '../lib/customAssets'
import AppImage from './AppImage'
import AskModal from './AskModal'
import GrowingPlant from './GrowingPlant'
import Icon from './Icon'
import Sprout from './Sprout'

/* 差し替えていないときに出る、もとの絵 */
const FALLBACKS = {
  record: <Sprout size={52} />,
  calendar: <Icon name="calendar" size={44} />,
  chart: <Icon name="chart" size={44} />,
  badge: <GrowingPlant totalDays={45} size={66} />,
  empty: <Sprout size={52} />,
  settings: <Icon name="sliders" size={44} />,
}

/** 画像を1枚えらぶボタン。取り込みと縮小はここで面倒を見る */
function PickImage({ onPick, children, className = '' }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const handle = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setBusy(true)
    setError(null)
    const result = await fileToImageData(file)
    setBusy(false)

    if (!result.ok) {
      setError(result.error)
      return
    }
    onPick(result.dataUrl)
  }

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={className}
      >
        {busy ? 'よみこみ中…' : children}
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handle} className="hidden" />
      {error && <p className="mt-1 text-[10px] font-black text-cheek-deep">{error}</p>}
    </>
  )
}

/* ── ① お祝いのセット ───────────────────────────────────── */

function CheerSetRow({ set, index, onChange, onRemove }) {
  return (
    <div className="ink-line blob-b bg-paper px-3 py-3">
      <div className="flex gap-3">
        {/* 絵 */}
        <div className="flex w-[100px] shrink-0 flex-col items-center gap-1.5">
          <div className="ink-line blob-b flex size-[96px] items-center justify-center overflow-hidden bg-warm-yellow">
            <AppImage
              src={set.image}
              size={88}
              fallback={<Sprout size={60} className="opacity-45" />}
            />
          </div>

          <PickImage
            onPick={(dataUrl) => onChange(index, { ...set, image: dataUrl })}
            className="ink-line blob-pill sticker-shadow flex w-full items-center justify-center gap-1 bg-usagi py-1 text-[10px] font-black active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
          >
            <ImagePlus size={12} strokeWidth={2.8} />
            {set.image ? '変える' : '絵をつける'}
          </PickImage>

          {set.image && (
            <button
              type="button"
              onClick={() => onChange(index, { ...set, image: null })}
              className="text-[10px] font-black text-ink-soft underline"
            >
              絵を けす
            </button>
          )}
        </div>

        {/* ことば */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <textarea
            rows={3}
            value={set.text}
            onChange={(e) => onChange(index, { ...set, text: e.target.value })}
            placeholder="なんとかなれーッ！！"
            aria-label="この絵に つける ことば"
            className="ink-line blob-b w-full resize-none bg-warm-yellow px-2.5 py-1.5 text-sm leading-relaxed font-bold outline-none focus:bg-paper"
          />

          <div className="flex items-center gap-1.5">
            <select
              value={set.category}
              onChange={(e) => onChange(index, { ...set, category: e.target.value })}
              aria-label="どのグループで出すか"
              className="ink-line blob-pill min-w-0 flex-1 bg-paper px-2 py-1 text-[11px] font-black outline-none"
            >
              {CHEER_GROUPS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label="このセットを けす"
              className="ink-line blob-b sticker-shadow flex size-8 shrink-0 items-center justify-center bg-paper active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
            >
              <Trash2 size={14} strokeWidth={2.6} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CheerSetsTab({ sets, onChange, onReset }) {
  const [group, setGroup] = useState('normal')

  const current = CHEER_GROUPS.find((g) => g.id === group)
  const rows = sets.map((s, index) => ({ set: s, index })).filter((r) => r.set.category === group)

  const changeAt = (index, next) => {
    const copy = [...sets]
    copy[index] = next
    onChange(copy)
  }

  const removeAt = (index) => onChange(sets.filter((_, i) => i !== index))
  const add = () => onChange([...sets, { category: group, text: '', image: null }])

  return (
    <>
      <p className="text-[11px] leading-relaxed font-bold text-ink-soft">
        「この絵には この ことば」の組を作ります。記録できたとき、
        <strong className="text-cheek-deep">組のまま</strong>
        出ます。
        <br />
        いくつ作ってもかまいません。作った数だけ ランダムに出ます。
        絵は あとから足せます。
      </p>

      <div className="grid grid-cols-4 gap-1.5">
        {CHEER_GROUPS.map((g) => {
          const count = sets.filter((s) => s.category === g.id).length
          const withImage = sets.filter((s) => s.category === g.id && s.image).length
          return (
            <button
              key={g.id}
              type="button"
              aria-pressed={group === g.id}
              onClick={() => setGroup(g.id)}
              className={`ink-line blob-pill py-1.5 text-[10px] leading-tight font-black transition ${
                group === g.id ? 'bg-cheek sticker-shadow' : 'bg-paper text-ink-soft'
              }`}
            >
              {g.label}
              <span className="block text-[9px]">
                {count}
                {withImage > 0 && `（絵${withImage}）`}
              </span>
            </button>
          )
        })}
      </div>

      <p className="text-center text-[10px] font-bold text-ink-soft">{current.hint}</p>

      {rows.length === 0 && (
        <p className="ink-line blob-b bg-paper px-3 py-4 text-center text-[11px] font-black text-ink-soft">
          このグループは まだ空です。
          <br />
          1つ以上 作ってください。
        </p>
      )}

      {rows.map((r) => (
        <CheerSetRow
          key={r.index}
          set={r.set}
          index={r.index}
          onChange={changeAt}
          onRemove={removeAt}
        />
      ))}

      <button
        type="button"
        onClick={add}
        className="ink-line blob-b sticker-shadow flex items-center justify-center gap-1.5 bg-usagi py-2.5 text-sm font-black active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
      >
        <Plus size={17} strokeWidth={3} />「{current.label}」に セットを足す
      </button>

      <button
        type="button"
        onClick={() => {
          if (window.confirm('作ったセットを ぜんぶ消して、もとに もどしますか？')) onReset()
        }}
        className="text-[11px] font-black text-ink-soft underline"
      >
        セットを ぜんぶ もとに もどす
      </button>
    </>
  )
}

/* ── ② 画面のかざり ─────────────────────────────────────── */

function DecorationsTab({ decorations, onPick, onClear }) {
  return (
    <>
      <p className="text-[11px] leading-relaxed font-bold text-ink-soft">
        それぞれの画面に出る絵です。ことばは付きません。
        えらばなければ、もとの絵のままです。
      </p>

      {DECORATION_SLOTS.map((slot) => (
        <div key={slot.id} className="ink-line blob-b flex items-center gap-3 bg-paper px-3 py-3">
          <div className="ink-line blob-b flex size-[92px] shrink-0 items-center justify-center overflow-hidden bg-warm-yellow">
            <AppImage src={decorations[slot.id]} size={84} fallback={FALLBACKS[slot.id]} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-black">{slot.label}</p>
            <p className="text-[10px] font-bold text-ink-soft">{slot.hint}</p>

            <div className="mt-1.5 flex gap-1.5">
              <PickImage
                onPick={(dataUrl) => onPick(slot.id, dataUrl)}
                className="ink-line blob-pill sticker-shadow flex-1 bg-usagi py-1.5 text-[11px] font-black active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
              >
                {decorations[slot.id] ? '別の絵にする' : '絵を えらぶ'}
              </PickImage>

              {decorations[slot.id] && (
                <button
                  type="button"
                  onClick={() => onClear(slot.id)}
                  className="ink-line blob-pill sticker-shadow bg-paper px-3 py-1.5 text-[11px] font-black active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
                >
                  もどす
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

/* ── 本体 ───────────────────────────────────────────────── */

function CustomizeView({
  decorations,
  cheerSets,
  onPickDecoration,
  onClearDecoration,
  onChangeCheerSets,
  onResetCheerSets,
  onBake,
  onPublish,
  onClose,
}) {
  const [tab, setTab] = useState('sets')
  const [bakeResult, setBakeResult] = useState(null)
  const [baking, setBaking] = useState(false)

  // 焼きこんだ直後に「公開もするか」を聞く。ちょっとした直しなら
  // これだけで、あとから別のバットファイルを探さなくて済む
  const [askPublish, setAskPublish] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishResult, setPublishResult] = useState(null)

  const handleBake = async () => {
    setBaking(true)
    setPublishResult(null)
    const result = await onBake()
    setBakeResult(result)
    setBaking(false)
    if (result.ok) setAskPublish(true)
  }

  const handlePublish = async () => {
    setAskPublish(false)
    setPublishing(true)
    setPublishResult(await onPublish())
    setPublishing(false)
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-warm-yellow">
      <div className="ink-line shrink-0 border-t-0 border-r-0 border-l-0 bg-paper px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-hand text-lg font-bold">絵と ことばの せってい</p>
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
            { id: 'sets', label: 'お祝いのセット', icon: 'heart', tone: 'bg-cheek' },
            { id: 'decorations', label: '画面のかざり', icon: 'note', tone: 'bg-hachi' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={tab === item.id ? 'page' : undefined}
              onClick={() => setTab(item.id)}
              className={`ink-line blob-pill flex flex-1 items-center justify-center gap-1.5 py-1.5 text-[11px] font-black transition ${
                tab === item.id ? `${item.tone} sticker-shadow` : 'bg-paper text-ink-soft'
              }`}
            >
              <Icon name={item.icon} size={14} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-md flex-col gap-2.5 px-4 py-4">
          {tab === 'sets' ? (
            <CheerSetsTab
              sets={cheerSets}
              onChange={onChangeCheerSets}
              onReset={onResetCheerSets}
            />
          ) : (
            <DecorationsTab
              decorations={decorations}
              onPick={onPickDecoration}
              onClear={onClearDecoration}
            />
          )}

          {/* ここで決めた内容を、アプリ本体の中身にする */}
          <div className="ink-line blob-a sticker-shadow mt-2 bg-grass px-4 py-3">
            <p className="mb-2 text-[11px] leading-relaxed font-bold">
              決まったら
              <strong>「アプリに焼きこむ」</strong>
              を押してください。
              <br />
              この画面は開発用なので、できあがったアプリには出ません。
              焼きこんだ内容だけが 残ります。
            </p>

            <button
              type="button"
              disabled={baking}
              onClick={handleBake}
              className="ink-line blob-b sticker-shadow flex w-full items-center justify-center gap-1.5 bg-paper py-2.5 text-sm font-black active:translate-x-[2px] active:translate-y-[3px] active:shadow-none disabled:opacity-50"
            >
              <Icon name="download" size={17} />
              {baking ? '焼きこみ中…' : 'アプリに 焼きこむ'}
            </button>

            {bakeResult && (
              <p
                className={`mt-2 text-center text-[11px] font-black ${
                  bakeResult.ok ? 'text-ink' : 'text-cheek-deep'
                }`}
              >
                {bakeResult.ok
                  ? `焼きこみました（セット ${bakeResult.sets}／かざり ${bakeResult.decorations}）`
                  : bakeResult.error}
              </p>
            )}

            {publishing && (
              <p className="mt-2 text-center text-[11px] font-black text-ink-soft">
                公開しています…30秒ほど かかることがあります
              </p>
            )}

            {publishResult && !publishing && (
              <p
                className={`mt-2 text-center text-[11px] font-black ${
                  publishResult.ok ? 'text-grass-deep' : 'text-cheek-deep'
                }`}
              >
                {publishResult.ok
                  ? publishResult.published
                    ? '公開しました。スマホのアイコンを開きなおすと反映されています'
                    : '公開ずみでした（前回から 変わったところが ありません）'
                  : publishResult.error}
              </p>
            )}
          </div>
        </div>
      </div>

      {askPublish && (
        <AskModal
          title={'焼きこみました！\nスマホの公開URLにも 送りだしますか？'}
          body="30秒ほどかかります。あとで まとめて公開しても構いません。"
          okLabel="いま 公開する"
          cancelLabel="あとで"
          onOk={handlePublish}
          onCancel={() => setAskPublish(false)}
        />
      )}
    </div>
  )
}

export default CustomizeView
