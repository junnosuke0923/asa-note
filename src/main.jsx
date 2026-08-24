import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/*
 * オフライン用の裏方を登録する。
 *
 * 公開ページ（Artifact）の中では使えない決まりなので、
 * 枠の中に埋め込まれて動いているときは登録しない。
 * 開発中も登録しない（古い控えが残って、直したはずの画面が出ないため）。
 */
const isEmbedded = window.self !== window.top

if ('serviceWorker' in navigator && !isEmbedded && !import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // 登録できなくても、アプリは通常どおり動く
    })
  })
}
