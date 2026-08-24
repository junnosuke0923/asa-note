import { TAGS } from '../lib/tags'
import Icon from './Icon'

function StampTagSelector({ selectedIds, onToggle }) {
  return (
    <div className="flex justify-center gap-2">
      {TAGS.map((tag) => {
        const isSelected = selectedIds.includes(tag.id)
        return (
          <button
            key={tag.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(tag.id)}
            className={`ink-line blob-pill sticker-shadow flex items-center gap-1 px-3 py-2 text-xs font-bold whitespace-nowrap transition active:translate-x-[3px] active:translate-y-[4px] active:shadow-none ${
              isSelected ? 'bg-cheek -rotate-2' : 'bg-paper text-ink-soft'
            }`}
          >
            <Icon name={tag.icon} size={18} />
            {tag.label}
          </button>
        )
      })}
    </div>
  )
}

export default StampTagSelector
