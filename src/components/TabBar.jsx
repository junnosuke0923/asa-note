import Icon from './Icon'

const TABS = [
  { id: 'record', icon: 'thermometer', label: 'きろく' },
  { id: 'calendar', icon: 'calendar', label: 'こよみ' },
  { id: 'chart', icon: 'chart', label: 'グラフ' },
  { id: 'badge', icon: 'sprout', label: 'けんてい' },
  { id: 'settings', icon: 'sliders', label: 'せってい' },
]

function TabBar({ activeId, onChange }) {
  return (
    <nav className="ink-line shrink-0 border-r-0 border-b-0 border-l-0 bg-paper px-1.5 pt-2 pb-3">
      <ul className="flex justify-around">
        {TABS.map((tab) => {
          const isActive = tab.id === activeId
          return (
            <li key={tab.id}>
              <button
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onChange(tab.id)}
                className={`blob-b flex w-[66px] flex-col items-center gap-0.5 py-1.5 transition ${
                  isActive ? 'ink-line sticker-shadow bg-cheek' : 'opacity-55'
                }`}
              >
                <Icon name={tab.icon} size={24} />
                <span className="text-[10px] font-black whitespace-nowrap">{tab.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default TabBar
