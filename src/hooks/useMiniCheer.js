import { useCallback, useEffect, useRef, useState } from 'react'
import { buildMiniCheer } from '../data/miniCheers'

/*
 * 小さな反応の出し入れ。
 *
 * 体温は ボタンを続けて押すことがあるので、少し待ってから1回だけ出す。
 * 出しっぱなしにならないよう、しばらくしたら自分で消える。
 */

const SETTLE_MS = 450 // 手が止まってから出すまで
const VISIBLE_MS = 1900 // 出ている時間

export function useMiniCheer() {
  const [cheer, setCheer] = useState(null)
  const settleRef = useRef(null)
  const hideRef = useRef(null)
  const seqRef = useRef(0)

  const show = useCallback((kind) => {
    if (!kind) return

    clearTimeout(settleRef.current)
    settleRef.current = setTimeout(() => {
      seqRef.current += 1
      // key を変えて、続けて出たときも animation をやり直させる
      setCheer({ ...buildMiniCheer(kind), key: seqRef.current })

      clearTimeout(hideRef.current)
      hideRef.current = setTimeout(() => setCheer(null), VISIBLE_MS)
    }, SETTLE_MS)
  }, [])

  useEffect(
    () => () => {
      clearTimeout(settleRef.current)
      clearTimeout(hideRef.current)
    },
    [],
  )

  return { cheer, show }
}
