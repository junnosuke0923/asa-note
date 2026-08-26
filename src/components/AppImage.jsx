/*
 * 差し替えできる絵。
 *
 * 設定されていればその画像を、なければ もとから入っている絵（fallback）を出す。
 * 置きかえたい場所は、この部品を通して描く。
 *
 * 大きさの決めかたは2通り。
 *   size      … 数値で決める。ほとんどの場所はこれでよい
 *   sizeClass … 画面の高さによって変えたいときだけ使う。
 *               縦に余裕のある端末では大きく、短い端末では小さくしたい
 *               場所があるため（記録画面の上の絵）。
 *               inline の style は class より強いので、
 *               sizeClass を渡したときは style を付けない。
 */
function AppImage({ src, size = 64, sizeClass = '', className = '', fallback, alt = '' }) {
  if (!src) return fallback ?? null

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt={alt}
      className={`object-contain ${sizeClass} ${className}`}
      style={sizeClass ? undefined : { width: size, height: size }}
    />
  )
}

export default AppImage
