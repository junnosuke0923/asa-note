import {
  CERTIFICATIONS,
  getCurrentCertification,
  getNextCertification,
} from '../lib/certification'
import AppImage from './AppImage'
import GrowingPlant from './GrowingPlant'
import Icon from './Icon'
import SubjugationCard from './SubjugationCard'

/* ── 賞状 ───────────────────────────────────────────────── */

function Certificate({ totalDays, current, image }) {
  return (
    <div className="ink-line blob-a sticker-shadow relative bg-paper px-4 pt-7 pb-5">
      {/* 上のリボン */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <span className="ink-line blob-pill bg-usagi px-4 py-0.5 text-[11px] font-black whitespace-nowrap">
          草むしり検定
        </span>
      </div>

      <div className="rule-inset blob-b flex flex-col items-center gap-1 px-3 py-4">
        <AppImage
          src={image}
          size={148}
          fallback={<GrowingPlant totalDays={totalDays} size={124} />}
        />

        {current ? (
          <>
            <p className="flex items-center gap-2 font-hand text-2xl leading-tight font-bold">
              <Icon name={current.icon} size={30} />
              {current.label}
            </p>
            <p className="text-[11px] font-bold text-ink-soft">{current.note}</p>
          </>
        ) : (
          <>
            <p className="font-hand text-xl leading-tight font-bold">受検中</p>
            <p className="text-[11px] font-bold text-ink-soft">
              3日ぶん つけると 5級の 受検生
            </p>
          </>
        )}
      </div>

      {/* 印鑑ふうの のべ日数（級のもとになる数） */}
      <div className="hanko absolute right-3 bottom-3 flex size-16 -rotate-12 flex-col items-center justify-center bg-paper/90">
        <span className="text-[9px] leading-none font-black">ぜんぶで</span>
        <span className="text-2xl leading-none font-black tabular-nums">{totalDays}</span>
        <span className="text-[9px] leading-none font-black">日</span>
      </div>
    </div>
  )
}

/* ── 次の級までの進み具合 ───────────────────────────────── */

function NextGoal({ totalDays, current, next }) {
  const from = current ? current.days : 0
  const progress = Math.min(100, Math.max(0, ((totalDays - from) / (next.days - from)) * 100))

  return (
    <div className="ink-line blob-a sticker-shadow bg-warm-yellow px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-black text-ink-soft">つぎの級</p>
        <p className="flex items-center gap-1.5 text-sm font-black">
          <Icon name={next.icon} size={18} />
          {next.label}
        </p>
      </div>

      {/* 草が伸びていくイメージのバー */}
      <div className="ink-line relative mt-2 h-5 overflow-hidden rounded-full bg-paper">
        <div
          className="h-full rounded-full bg-grass transition-[width] duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
        <span
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-700 ease-out"
          style={{ left: `${progress}%` }}
        >
          <Icon name="sprout" size={16} />
        </span>
      </div>

      <p className="mt-1.5 text-center text-xs font-black">
        あと <span className="text-base text-cheek-deep">{next.days - totalDays}</span> 日
      </p>
    </div>
  )
}

/* ── 道のり ─────────────────────────────────────────────── */

function Milestone({ cert, unlocked, isNext, index }) {
  return (
    <li className="relative flex items-center gap-3 pl-1">
      {/* 道の上の丸 */}
      <span
        className={`ink-line relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full ${
          unlocked ? 'sticker-shadow bg-usagi' : 'border-dashed bg-paper opacity-60'
        }`}
      >
        <Icon name={unlocked ? cert.icon : 'lock'} size={24} />
      </span>

      {/* ふきだし風のカード。左右にわずかに傾けて手貼り感を出す */}
      <span
        className={`ink-line blob-b flex flex-1 items-center gap-2 px-3 py-2 ${
          unlocked
            ? 'sticker-shadow bg-paper'
            : 'border-dashed bg-paper/60 opacity-60'
        } ${index % 2 === 0 ? '-rotate-[0.6deg]' : 'rotate-[0.6deg]'}`}
      >
        <span className="flex-1">
          <span className="block text-sm font-black">
            {cert.label}
          </span>
          <span className="block text-[11px] font-bold text-ink-soft">
            {unlocked ? cert.note : `${cert.days}日で かいほう`}
          </span>
        </span>

        {isNext ? (
          <span className="ink-line blob-pill bg-cheek px-2 py-0.5 text-[10px] font-black whitespace-nowrap">
            つぎ
          </span>
        ) : (
          <span className="text-[11px] font-black text-ink-soft">{cert.days}日</span>
        )}
      </span>
    </li>
  )
}

function Road({ totalDays, next }) {
  return (
    <div className="ink-line blob-a sticker-shadow bg-warm-yellow px-3 py-4">
      <p className="mb-3 text-center text-xs font-black text-ink-soft">これまでの みち</p>

      <div className="relative">
        {/* 丸をつなぐ縦の道 */}
        <span
          className="absolute top-5 bottom-5 left-[22px] w-0 border-l-[3px] border-dashed border-ink/25"
          aria-hidden="true"
        />
        <ul className="relative flex flex-col gap-2.5">
          {CERTIFICATIONS.map((cert, index) => (
            <Milestone
              key={cert.days}
              cert={cert}
              index={index}
              unlocked={totalDays >= cert.days}
              isNext={next?.days === cert.days}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ── まとめ ─────────────────────────────────────────────── */

function SummaryCard({ label, value, unit, tone }) {
  return (
    <div className={`ink-line blob-b sticker-shadow flex-1 px-2 py-3 text-center ${tone}`}>
      <p className="text-[10px] font-black text-ink-soft">{label}</p>
      <p className="leading-none font-black">
        <span className="text-3xl tabular-nums">{value}</span>
        <span className="pl-0.5 text-xs">{unit}</span>
      </p>
    </div>
  )
}

/* ── 本体 ───────────────────────────────────────────────── */

function CertificationView({ streak, totalDays, bestStreak, image, subjugation }) {
  // 級は「のべ何日つけたか」で決まる。連続が途切れても下がらない
  const current = getCurrentCertification(totalDays)
  const next = getNextCertification(totalDays)

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-5 pt-6 pb-5">
      <Certificate totalDays={totalDays} current={current} image={image} />

      {next && <NextGoal totalDays={totalDays} current={current} next={next} />}

      <div className="flex gap-3">
        <SummaryCard label="いま つづけて" value={streak} unit="日" tone="bg-hachi" />
        <SummaryCard label="さいちょう記録" value={bestStreak} unit="日" tone="bg-cheek" />
      </div>

      <SubjugationCard subjugation={subjugation} />

      <Road totalDays={totalDays} next={next} />

      {!next && (
        <p className="pb-1 text-center text-xs font-black text-cheek-deep">
          ぜんぶ せいは した…！ スゴ…
        </p>
      )}
    </div>
  )
}

export default CertificationView
