import { useState } from 'react'
import Icon from './Icon'

/*
 * 記録が保存できていないときの警告。
 *
 * いちばん困るのは「残っているつもりで、実は残っていない」こと。
 * 設定画面の奥に置いても気づけないので、どの画面にいても見えるところに出す。
 *
 * 消せるようにはするが、閉じても次に開いたときはまた出る。
 * 気づかないまま何日も記録し続けるのを防ぐため。
 */
function StorageWarning() {
  const [hidden, setHidden] = useState(false)

  if (hidden) return null

  return (
    <div className="ink-line shrink-0 border-t-0 border-r-0 border-l-0 bg-cheek px-3 py-2">
      <div className="mx-auto flex w-full max-w-md items-start gap-2">
        <span className="mt-0.5 shrink-0">
          <Icon name="unwell" size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-xs leading-snug font-black">記録が 保存できていません</p>
          <p className="mt-0.5 text-[10px] leading-relaxed font-bold">
            このブラウザでは 保存が止められています。
            <strong>いま入れた記録は、閉じると消えます。</strong>
            <br />
            プライベートモードを やめるか、ふつうのウィンドウで開いてください。
          </p>
        </div>

        <button
          type="button"
          onClick={() => setHidden(true)}
          aria-label="この知らせを 閉じる"
          className="shrink-0 text-[10px] font-black underline"
        >
          閉じる
        </button>
      </div>
    </div>
  )
}

export default StorageWarning
