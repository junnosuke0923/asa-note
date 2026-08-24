import { describeSubjugation, SUBJUGATION_KINDS } from '../lib/subjugation'
import Icon from './Icon'
import TinyChara from './TinyChara'

/*
 * 討伐の記録。
 *
 * 検定（草むしり）は「毎日つづけたこと」を数える。
 * こちらは「大変な日を越えたこと」を数える。
 *
 * 連続が途切れると検定は0に戻ってしまうが、
 * 討伐は減らない。しんどい時期を越えたことは、
 * あとから無かったことにはならないため。
 */
function SubjugationCard({ subjugation }) {
  const { total, byKind } = subjugation

  return (
    <div className="ink-line blob-a sticker-shadow bg-paper px-4 py-3">
      <div className="flex items-center gap-2">
        <TinyChara pose="proud" size={30} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black text-ink-soft">討伐した日</p>
          <p className="leading-none font-black">
            <span className="text-3xl tabular-nums">{total}</span>
            <span className="pl-1 text-sm">日</span>
          </p>
        </div>
        <span className="ink-line blob-pill bg-usagi px-2.5 py-1 text-[10px] font-black whitespace-nowrap">
          {describeSubjugation(total)}
        </span>
      </div>

      <p className="mt-2 text-[10px] leading-relaxed font-bold text-ink-soft">
        つらい朝や 病院の日でも つけられた日のこと。
        <br />
        連続が途切れても、ここは <strong className="text-cheek-deep">減りません</strong>。
      </p>

      <ul className="mt-2 flex flex-col gap-1">
        {SUBJUGATION_KINDS.map((kind) => (
          <li
            key={kind.id}
            className="flex items-center gap-2 border-b border-dashed border-ink/15 py-1 last:border-b-0"
          >
            <Icon name={kind.icon} size={15} />
            <span className="flex-1 text-[11px] font-black">{kind.label}</span>
            <span className="text-[10px] font-bold text-ink-soft">{kind.note}</span>
            <span className="w-8 text-right text-sm font-black tabular-nums">
              {byKind[kind.id]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SubjugationCard
