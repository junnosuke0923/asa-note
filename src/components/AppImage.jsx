/*
 * 差し替えできる絵。
 *
 * 設定されていればその画像を、なければ もとから入っている絵（fallback）を出す。
 * 置きかえたい場所は、この部品を通して描く。
 */
function AppImage({ src, size = 64, className = '', fallback, alt = '' }) {
  if (!src) return fallback ?? null

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt={alt}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

export default AppImage
