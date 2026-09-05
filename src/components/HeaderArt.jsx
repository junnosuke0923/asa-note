import AppImage from './AppImage'

/*
 * 各画面のいちばん上に置く、差し替えできる絵。
 *
 * ■ なぜ正方形の枠にしないのか
 * 差し替える絵は横長のことが多い。正方形の枠に入れると左右が余り、
 * 決めた大きさよりずっと小さく見えてしまう。
 * そこで高さだけを決めて、幅は絵の形にまかせる。
 * 画面より広がらないよう max-w-full だけ添えておく。
 *
 * ■ なぜ見出しの横ではなく上に置くのか
 * 文字の横に並べると、絵の大きさは行の高さで頭打ちになる。
 * 1行つかって上に置けば、画面の幅いっぱいまで使える。
 *
 * ■ 高さを画面の高さで変える理由
 * 記録画面と同じ。背の低い端末では、絵が大きいだけ
 * 下の中身が画面の外へ押し出されるため。
 */
const ART_HEIGHT =
  'h-[68px] [@media(min-height:760px)]:h-[84px] [@media(min-height:880px)]:h-[104px]'

function HeaderArt({ src, fallback, className = '' }) {
  return (
    <div className={`flex ${ART_HEIGHT} items-end justify-center ${className}`}>
      <AppImage
        src={src}
        size={104}
        sizeClass="h-full w-auto max-w-full"
        className="animate-fuwa"
        fallback={fallback}
      />
    </div>
  )
}

export default HeaderArt
