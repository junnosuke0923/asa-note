/*
 * 草むしり検定にちなんだ草のモチーフ。
 * 仕様どおり、後から cheer.png 等の画像に差し替えられるよう独立させてある。
 */
function Sprout({ size = 72, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <g
        stroke="var(--color-ink)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M36 62V33" />
        <path
          d="M36 40C36 40 24 39 20 30c-1.5-3.4-1-7 .6-8.4 3.4-3 11.4 1.2 14 8.6 1 2.8 1.4 6.4 1.4 9.8Z"
          fill="var(--color-grass)"
        />
        <path
          d="M36 34c0-3.6.6-7.6 1.9-10.5 3.1-7 10.9-10.6 14-7.4 1.5 1.6 1.7 5.4-.1 8.7C47.9 33.4 36 34 36 34Z"
          fill="var(--color-grass-deep)"
        />
        <path d="M25 62h22" />
      </g>
    </svg>
  )
}

export default Sprout
