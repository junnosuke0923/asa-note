import { useEffect, useRef } from 'react'
import { todayKey } from '../lib/dateUtils'
import { readText, writeText } from '../lib/storage'

/*
 * 毎朝の「はかってね」通知。
 *
 * 外のサービスは使わず、ブラウザの通知機能だけで出す。
 * そのぶん制約があるので、正直に書いておく：
 *   ・アプリが動いている間しか鳴らない（完全に終了していると鳴らない）
 *   ・ホーム画面に追加しておくと鳴りやすくなる
 *
 * ホーム画面に追加してあるときは、裏方（サービスワーカー）から通知を出す。
 * そのほうが端末に扱ってもらいやすく、タップでアプリが開く。
 *
 * 「その日もう鳴らしたか」は端末に覚えさせて、二重に鳴らないようにする。
 */

const LAST_NOTIFIED_KEY = 'kiso-taion:last-notified'
const CHECK_INTERVAL_MS = 30 * 1000

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getPermission() {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestPermission() {
  if (!isNotificationSupported()) return 'unsupported'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

function readLastNotified() {
  return readText(LAST_NOTIFIED_KEY)
}

function writeLastNotified(key) {
  writeText(LAST_NOTIFIED_KEY, key)
}

/** "07:00" を、その日の0時からの分数に */
function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

const TITLE = 'きょうの体温、はかった？'
const BODY = 'なんとかなれーッ！！ 記録まってるよ'

/**
 * 通知を出す。
 * ホーム画面に追加してあれば裏方から出す（タップでアプリが開く）。
 * だめなら、その場の通知にする。
 */
async function showReminder() {
  const options = {
    body: BODY,
    tag: 'kiso-taion-reminder',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    lang: 'ja',
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration?.showNotification) {
        await registration.showNotification(TITLE, options)
        return
      }
    }
    new Notification(TITLE, options)
  } catch {
    // 通知が出せない環境では黙って諦める
  }
}

export function useReminder({ enabled, time, alreadyRecordedToday }) {
  // 「もう記録した」状態は毎回変わるが、これが変わるたびに
  // タイマーを張り直したくないので、ref に逃がして見張りは継続させる
  const alreadyRef = useRef(alreadyRecordedToday)

  useEffect(() => {
    alreadyRef.current = alreadyRecordedToday
  }, [alreadyRecordedToday])

  useEffect(() => {
    if (!enabled) return
    if (!isNotificationSupported()) return
    if (Notification.permission !== 'granted') return

    const check = () => {
      const today = todayKey()

      // もう今日つけてあるなら鳴らさない
      if (alreadyRef.current) return
      // 今日ぶんはもう鳴らした
      if (readLastNotified() === today) return

      const now = new Date()
      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      const target = timeToMinutes(time)

      // 設定時刻を過ぎていて、まだ2時間以内なら鳴らす。
      // 夜にアプリを開いたときに朝の通知が出るのを防ぐため。
      if (nowMinutes < target || nowMinutes > target + 120) return

      showReminder()
      writeLastNotified(today)
    }

    check()
    const timer = setInterval(check, CHECK_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [enabled, time])
}
