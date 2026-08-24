import { useEffect, useState } from 'react'
import Icon from './Icon'

/*
 * ホーム画面への追加のご案内。
 *
 * 追加しておくと
 *   ・ブラウザの枠が消えて、ふつうのアプリのように開く
 *   ・毎朝のおしらせが鳴りやすくなる
 *   ・電波がなくても開ける
 *
 * Androidなどでは「追加しますか」を出せる合図がブラウザから届くので、
 * そのときはボタンを出す。iPhoneでは合図が来ないので手順を書く。
 */

function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function isIos() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function InstallCard() {
  const [promptEvent, setPromptEvent] = useState(null)
  const [installed, setInstalled] = useState(isStandalone)

  useEffect(() => {
    const onPrompt = (event) => {
      event.preventDefault()
      setPromptEvent(event)
    }
    const onInstalled = () => {
      setInstalled(true)
      setPromptEvent(null)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!promptEvent) return
    promptEvent.prompt()
    await promptEvent.userChoice
    setPromptEvent(null)
  }

  if (installed) {
    return (
      <div className="ink-line blob-a sticker-shadow bg-grass px-4 py-3">
        <p className="flex items-center gap-1.5 text-[11px] font-black">
          <Icon name="sprout" size={16} />
          ホーム画面から ひらいています
        </p>
        <p className="mt-1 text-[10px] font-bold text-ink-soft">
          おしらせも 鳴りやすい状態です
        </p>
      </div>
    )
  }

  return (
    <div className="ink-line blob-a sticker-shadow bg-paper px-4 py-3">
      <p className="mb-2 text-[11px] font-black text-ink-soft">ホーム画面に追加</p>

      <p className="mb-2 text-[11px] leading-relaxed font-bold text-ink-soft">
        追加すると、ふつうのアプリのように開けて、
        <strong className="text-cheek-deep">毎朝のおしらせが鳴りやすく</strong>
        なります。電波がなくても開けます。
      </p>

      {promptEvent ? (
        <button
          type="button"
          onClick={handleInstall}
          className="ink-line blob-b sticker-shadow flex w-full items-center justify-center gap-1.5 bg-cheek py-2.5 text-sm font-black active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
        >
          <Icon name="download" size={17} />
          ホーム画面に ついかする
        </button>
      ) : (
        <p className="text-[11px] leading-relaxed font-bold text-ink-soft">
          {isIos() ? (
            <>
              Safariの下にある
              <strong className="text-cheek-deep">「共有」</strong>
              →
              <strong className="text-cheek-deep">「ホーム画面に追加」</strong>
              で追加できます。
            </>
          ) : (
            <>
              ブラウザのメニュー（︙）から
              <strong className="text-cheek-deep">「ホーム画面に追加」</strong>
              または
              <strong className="text-cheek-deep">「アプリをインストール」</strong>
              を選んでください。
            </>
          )}
        </p>
      )}
    </div>
  )
}

export default InstallCard
