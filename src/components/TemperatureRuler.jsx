import { useCallback, useEffect, useRef } from 'react'
import {
  clampCents,
  MAX_CENTS,
  MIN_CENTS,
  scrollToTemperature,
  STEP_PX,
  temperatureToScroll,
} from '../lib/ruler'

/*
 * 体温を「目盛りをなぞって」決める入力。
 *
 * ＋/− を何度も押す方式だと 36.50→36.78 で10タップ必要になり、
 * 朝いちばんの操作としては重すぎた。指をすべらせる1操作で決められるようにする。
 *
 * 仕組みは横スクロール。目盛りの帯を左右に動かし、
 * まん中の針が指している値を読む。
 *
 * 吸着（0.01ぴったりで止める）は CSS の scroll-snap ではなく自前でやっている。
 * scroll-snap は目盛りの「要素の中心」に合わせにくるため、こちらの計算と
 * 1pxずれて、値が決まらなくなったため。
 */

const SETTLE_MS = 130 // 指が止まってから吸着させるまでの間

function TemperatureRuler({ value, onChange }) {
  const scrollRef = useRef(null)
  const isProgrammatic = useRef(false)
  const rafRef = useRef(null)
  const settleRef = useRef(null)
  const releaseRef = useRef(null)

  const scrollToCents = useCallback((cents, smooth) => {
    const el = scrollRef.current
    if (!el) return

    isProgrammatic.current = true
    el.scrollTo({ left: temperatureToScroll(cents / 100), behavior: smooth ? 'smooth' : 'auto' })

    clearTimeout(releaseRef.current)
    releaseRef.current = setTimeout(() => {
      isProgrammatic.current = false
    }, smooth ? 320 : 60)
  }, [])

  // 外から値が変わったとき（＋/−ボタン・数字入力・初期表示）に位置を合わせる
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    if (Math.abs(el.scrollLeft - temperatureToScroll(value)) < 1) return

    scrollToCents(Math.round(value * 100), false)
  }, [value, scrollToCents])

  const handleScroll = () => {
    if (isProgrammatic.current) return

    // なぞっている間も数字を追従させる
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const el = scrollRef.current
      if (!el) return

      const next = scrollToTemperature(el.scrollLeft)
      if (Math.round(next * 100) !== Math.round(value * 100)) onChange(next)
    })

    // 指が止まったら、0.01ぴったりの位置へ寄せる
    clearTimeout(settleRef.current)
    settleRef.current = setTimeout(() => {
      const el = scrollRef.current
      if (!el) return

      const settled = scrollToTemperature(el.scrollLeft)
      if (Math.abs(el.scrollLeft - temperatureToScroll(settled)) > 0.5) {
        scrollToCents(Math.round(settled * 100), true)
      }
    }, SETTLE_MS)
  }

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current)
      clearTimeout(settleRef.current)
      clearTimeout(releaseRef.current)
    },
    [],
  )

  const nudge = (delta) => onChange(clampCents(Math.round(value * 100) + delta) / 100)

  // 目盛り。0.1ごとに長い線と数字、0.05に中くらい、あとは短い線
  const ticks = []
  for (let cents = MIN_CENTS; cents <= MAX_CENTS; cents += 1) {
    const isMajor = cents % 10 === 0
    const isMid = cents % 5 === 0
    ticks.push(
      <div
        key={cents}
        className="absolute bottom-0 flex flex-col items-center"
        style={{ left: (cents - MIN_CENTS) * STEP_PX }}
      >
        {isMajor && (
          <span className="absolute -top-5 text-[10px] font-black whitespace-nowrap text-ink-soft">
            {(cents / 100).toFixed(1)}
          </span>
        )}
        <span
          className="block w-[2px] -translate-x-1/2 rounded-full"
          style={{
            height: isMajor ? 26 : isMid ? 16 : 10,
            background: isMajor ? 'var(--color-ink)' : 'var(--color-ink-soft)',
            opacity: isMajor ? 1 : 0.55,
          }}
        />
      </div>,
    )
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="ruler-scroll ink-line blob-b sticker-shadow overflow-x-scroll bg-paper pt-6 pb-2"
        role="slider"
        aria-label="体温を えらぶ"
        aria-valuemin={MIN_CENTS / 100}
        aria-valuemax={MAX_CENTS / 100}
        aria-valuenow={value}
        aria-valuetext={`${value.toFixed(2)}度`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            nudge(-1)
          }
          if (e.key === 'ArrowRight') {
            e.preventDefault()
            nudge(1)
          }
        }}
      >
        {/*
          左右に画面半分ぶんの余白を入れてある。
          これで端の値（35.00 / 38.50）もまん中の針まで届く。
          余白が半分ぶんなので、scrollLeft = (目盛り番号 × STEP_PX) がそのまま成り立つ。
        */}
        <div
          className="relative h-8"
          style={{ width: (MAX_CENTS - MIN_CENTS) * STEP_PX, marginInline: '50%' }}
        >
          {ticks}
        </div>
      </div>

      {/* まん中の針。ここが指している値になる */}
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 flex -translate-x-1/2 flex-col items-center justify-start pt-1"
        aria-hidden="true"
      >
        <span className="text-[10px] leading-none text-cheek-deep">▼</span>
        <span className="w-[3px] flex-1 rounded-full bg-cheek-deep" />
      </div>
    </div>
  )
}

export default TemperatureRuler
