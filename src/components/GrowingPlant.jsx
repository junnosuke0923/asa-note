/*
 * つけた のべ日数に応じて育つ草。
 *
 * 「草むしり検定」なので、級が上がる＝草が育つ、という見た目にした。
 * 数字だけだと達成感が伝わりにくいため。
 *
 * 節目は級と同じにしてある（3 / 21 / 45 / 80 / 120日）。
 * 連続ではなく のべ日数なので、いちど育った草が枯れることはない。
 *
 * 葉は1枚のパスを左右反転・回転させて使い回している。
 */

const GROUND_Y = 86
const CENTER_X = 60

/** 級の区切りと合わせた6段階 */
const STAGES = [
  { min: 0, stemTop: GROUND_Y, leaves: 0, flower: false, label: 'たね' },
  { min: 3, stemTop: 64, leaves: 1, flower: false, label: 'め' },
  { min: 21, stemTop: 52, leaves: 2, flower: false, label: 'ふたば' },
  { min: 45, stemTop: 42, leaves: 3, flower: false, label: 'くさ' },
  { min: 80, stemTop: 32, leaves: 4, flower: false, label: 'しげる' },
  { min: 120, stemTop: 26, leaves: 4, flower: true, label: 'はな' },
]

function getStage(totalDays) {
  let stage = STAGES[0]
  for (const candidate of STAGES) {
    if (totalDays >= candidate.min) stage = candidate
  }
  return stage
}

/** 葉の付け根の位置と向き。下から順に、左右交互に生える */
const LEAF_SLOTS = [
  { y: 72, side: -1, rotate: -14, scale: 0.78 },
  { y: 62, side: 1, rotate: -12, scale: 0.9 },
  { y: 50, side: -1, rotate: -16, scale: 0.82 },
  { y: 40, side: 1, rotate: -14, scale: 0.72 },
]

const LEAF_PATH = 'M0 0C7-7 18-8 25-1 18 7 7 7 0 0Z'

function GrowingPlant({ totalDays = 0, size = 132, className = '' }) {
  const stage = getStage(totalDays)
  const visibleLeaves = LEAF_SLOTS.slice(0, stage.leaves).filter(
    (slot) => slot.y > stage.stemTop + 4,
  )

  return (
    <svg
      width={size}
      height={(size * 100) / 120}
      viewBox="0 0 120 100"
      fill="none"
      className={className}
      role="img"
      aria-label={`のべ${totalDays}日ぶんの草（${stage.label}）`}
    >
      {/* 土 */}
      <path
        d="M16 90Q60 78 104 90"
        stroke="var(--color-ink)"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path
        d="M26 95h6M42 96h5M70 96h6M86 94h6"
        stroke="var(--color-ink)"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.4"
      />

      {stage.leaves === 0 ? (
        // 種：まだ何も生えていない
        <ellipse
          cx={CENTER_X}
          cy={GROUND_Y - 2}
          rx="7"
          ry="5.5"
          fill="var(--color-usagi)"
          stroke="var(--color-ink)"
          strokeWidth="3"
        />
      ) : (
        <g className="animate-sway" style={{ transformOrigin: `${CENTER_X}px ${GROUND_Y}px` }}>
          {/* 茎 */}
          <path
            d={`M${CENTER_X} ${GROUND_Y}V${stage.stemTop}`}
            stroke="var(--color-ink)"
            strokeWidth="3.4"
            strokeLinecap="round"
          />

          {/* 葉 */}
          {visibleLeaves.map((slot, i) => (
            <path
              key={i}
              d={LEAF_PATH}
              fill={i % 2 === 0 ? 'var(--color-grass)' : 'var(--color-grass-deep)'}
              stroke="var(--color-ink)"
              strokeWidth="3"
              strokeLinejoin="round"
              transform={`translate(${CENTER_X} ${slot.y}) scale(${slot.side * slot.scale} ${slot.scale}) rotate(${slot.rotate})`}
            />
          ))}

          {/* 花（1級から） */}
          {stage.flower && (
            <g>
              {[0, 72, 144, 216, 288].map((angle) => (
                <ellipse
                  key={angle}
                  cx={CENTER_X}
                  cy={stage.stemTop - 9}
                  rx="5.5"
                  ry="8"
                  fill="var(--color-cheek)"
                  stroke="var(--color-ink)"
                  strokeWidth="2.8"
                  transform={`rotate(${angle} ${CENTER_X} ${stage.stemTop - 1})`}
                />
              ))}
              <circle
                cx={CENTER_X}
                cy={stage.stemTop - 1}
                r="5"
                fill="var(--color-usagi)"
                stroke="var(--color-ink)"
                strokeWidth="2.8"
              />
            </g>
          )}
        </g>
      )}
    </svg>
  )
}

export default GrowingPlant
