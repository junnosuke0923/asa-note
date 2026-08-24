import StatusBar from './StatusBar'

/*
 * PCの広い画面で開いたときに、アプリをスマホの実寸（390×844）の枠の中に表示する。
 * 実機のスマホ幅（768px未満）では枠・ステータスバー・ホームバーが消えて、
 * そのまま全画面表示になる（本物のステータスバーがあるため）。
 */
function PhoneFrame({ children }) {
  return (
    <div className="phone-stage">
      <div className="phone-frame">
        <div className="phone-island" aria-hidden="true" />

        <div className="phone-screen">
          <StatusBar />

          {/* 画面の中身。全画面のパネル（日の編集・印刷など）はここを基準に重なる */}
          <div className="phone-body">{children}</div>

          <div className="phone-home" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

export default PhoneFrame
