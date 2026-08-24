import { useEffect, useState } from 'react'

/*
 * スマホ画面いちばん上の帯（ステータスバー）。
 *
 * 実機に近い見た目にするための飾りだが、出せる情報は実物を使う：
 *   時刻     … 実際の現在時刻（1分ごとに更新）
 *   電波/WiFi … つながっているかどうか（navigator.onLine）
 *   電池     … 取れる端末では実際の残量。取れなければ既定値を出す
 *
 * PCの枠表示のときだけ出す。実機で開いたときは本物のステータスバーがあるので、
 * CSS側（768px未満）で隠している。
 */

function useClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    // 分が変わる瞬間に合わせてから、以後は1分ごと
    const msToNextMinute = (60 - new Date().getSeconds()) * 1000
    let interval

    const timeout = setTimeout(() => {
      setNow(new Date())
      interval = setInterval(() => setNow(new Date()), 60_000)
    }, msToNextMinute)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [])

  return now
}

function useOnline() {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  return online
}

const FALLBACK_BATTERY = 0.82

function useBattery() {
  const [level, setLevel] = useState(FALLBACK_BATTERY)
  const [charging, setCharging] = useState(false)

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.getBattery) return

    let battery
    let cancelled = false

    const sync = () => {
      if (!battery || cancelled) return
      setLevel(battery.level)
      setCharging(battery.charging)
    }

    navigator
      .getBattery()
      .then((b) => {
        if (cancelled) return
        battery = b
        sync()
        b.addEventListener('levelchange', sync)
        b.addEventListener('chargingchange', sync)
      })
      .catch(() => {
        // 取れない端末では既定値のまま
      })

    return () => {
      cancelled = true
      if (battery) {
        battery.removeEventListener('levelchange', sync)
        battery.removeEventListener('chargingchange', sync)
      }
    }
  }, [])

  return { level, charging }
}

/** 電波の棒 */
function SignalIcon({ online }) {
  const heights = [4, 6.5, 9, 11.5]
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
      {heights.map((h, i) => (
        <rect
          key={i}
          x={i * 4.4}
          y={12 - h}
          width="3"
          height={h}
          rx="1"
          fill="currentColor"
          opacity={online || i < 2 ? 1 : 0.3}
        />
      ))}
    </svg>
  )
}

function WifiIcon({ online }) {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M1.2 4.2A10.5 10.5 0 0 1 14.8 4.2" opacity={online ? 1 : 0.25} />
        <path d="M3.7 6.9A6.8 6.8 0 0 1 12.3 6.9" opacity={online ? 1 : 0.25} />
      </g>
      <circle cx="8" cy="10.2" r="1.5" fill="currentColor" opacity={online ? 1 : 0.25} />
      {!online && (
        <path d="M2 11L14 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      )}
    </svg>
  )
}

function BatteryIcon({ level, charging }) {
  const width = Math.max(2, Math.round(level * 18))
  const low = level <= 0.2 && !charging

  return (
    <span className="flex items-center gap-1">
      <svg width="27" height="13" viewBox="0 0 27 13" aria-hidden="true">
        <rect
          x="0.7"
          y="0.7"
          width="22"
          height="11.6"
          rx="3.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          opacity="0.45"
        />
        <path
          d="M24.4 4.4c1.1.4 1.1 3.8 0 4.2z"
          fill="currentColor"
          opacity="0.45"
        />
        <rect
          x="2.2"
          y="2.2"
          width={width}
          height="8.6"
          rx="2"
          fill={low ? '#e5484d' : 'currentColor'}
        />
        {charging && (
          <path
            d="M12.4 2.6 8.6 7.3h2.6l-1 3.4 4-4.9h-2.7z"
            fill="var(--color-paper)"
            stroke="var(--color-ink)"
            strokeWidth="0.5"
          />
        )}
      </svg>
    </span>
  )
}

function StatusBar() {
  const now = useClock()
  const online = useOnline()
  const { level, charging } = useBattery()

  const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`

  return (
    <div
      className="phone-statusbar shrink-0 items-center justify-between px-7 text-ink select-none"
      role="presentation"
    >
      <span className="w-[54px] text-[13px] leading-none font-bold tracking-tight tabular-nums">
        {time}
      </span>

      <span className="flex items-center gap-1.5">
        <SignalIcon online={online} />
        <WifiIcon online={online} />
        <span className="text-[10px] leading-none font-bold tabular-nums opacity-70">
          {Math.round(level * 100)}
        </span>
        <BatteryIcon level={level} charging={charging} />
      </span>
    </div>
  )
}

export default StatusBar
