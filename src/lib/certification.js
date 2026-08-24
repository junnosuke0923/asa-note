/*
 * 「草むしり検定」— つけた日の“のべ日数”で上がっていく級。
 *
 * ■ なぜ「連続」ではなく「のべ」なのか
 *
 * 以前は連続記録日数で級を決めていたが、これは筋が悪かった。
 * 一度でも測り忘れると0に戻るため、半年つづけた人が
 * 1日の寝坊で1級を失うことになる。
 *
 * 基礎体温の指導は「完璧を目指さず、測り忘れた日があっても続ける」
 * 「強いストレスを感じるなら無理しない」というもの。
 * 連続で罰する仕組みは、この助言と正面からぶつかる。
 * 不妊治療中は体調も予定も乱れやすく、なおさら合わない。
 *
 * そこで級は「これまでに何日ぶん つけたか」で決める。減ることはない。
 * 連続日数は別の場所に、おまけとして出す。
 *
 * ■ 日数の決めかた
 *
 * このバッジの役目は「認定の正しさ」ではなく「毎朝の気持ちを上げること」。
 * 節目が遠いと、途中の何十日かは 何も起きない ただの空白になってしまう。
 * 治療中に毎朝つけるものなので、そこは軽く、こまめに上がるほうがいい。
 *
 * そこで 級ごとに「受検生」と「合格」の2段を置いた。
 * 級は5つのままだが、上がる回数は倍になる。
 * ちいかわが 5級に受かるまで受検生をくり返したのと同じ形なので、
 * 級を勝手に増やすより 世界観にも合う。
 *
 * 間隔は 最初は3〜7日、そのあとも だいたい2〜3週間ごと。
 * 1級は4か月ほど。不妊治療の期間（中央値7か月）の中に十分おさまる。
 *
 * ■ 級の立てかた
 * 原作の草むしり検定にならい、5級から1級まで。1級がいちばん上。
 * 名人だけは原作に無いが、1級の先の行き止まりを作らないよう1つ置いた。
 *
 * label は表示する文字そのもの。
 * 以前は「級」と「称号」を別々に持たせていたが、
 * つなげると「名人 草むしり名人」のように重なってしまったので1つにした。
 */
export const CERTIFICATIONS = [
  { days: 3, label: '5級 受検生', icon: 'seed', note: 'まずは3日。ここが いちばん えらい' },
  { days: 7, label: '5級 合格', icon: 'sprout', note: '1週間ぶん。ちいかわは3回かかった' },
  { days: 14, label: '4級 受検生', icon: 'sprout', note: '2週間ぶん。つぎの級へ' },
  { days: 21, label: '4級 合格', icon: 'clover', note: '3週間ぶん。もう習慣' },
  { days: 30, label: '3級 受検生', icon: 'clover', note: '1か月ぶん たまった' },
  { days: 45, label: '3級 合格', icon: 'grass', note: 'うさぎと おなじ級' },
  { days: 60, label: '2級 受検生', icon: 'grass', note: '2か月ぶん' },
  { days: 80, label: '2級 合格', icon: 'bud', note: 'あと ひと息' },
  { days: 100, label: '1級 受検生', icon: 'bud', note: '100日ぶん。いよいよ1級' },
  { days: 120, label: '1級 合格', icon: 'flower', note: '4か月ぶん。いちばん上の級' },
  { days: 180, label: '名人', icon: 'crown', note: '半年ぶん。もう言うことなし' },
]

/** いまの級（のべ日数で決まる）。まだ何も無ければ null */
export function getCurrentCertification(totalDays) {
  const unlocked = CERTIFICATIONS.filter((cert) => totalDays >= cert.days)
  return unlocked.length > 0 ? unlocked[unlocked.length - 1] : null
}

/** 次に目指す級。全部とったら null */
export function getNextCertification(totalDays) {
  return CERTIFICATIONS.find((cert) => totalDays < cert.days) ?? null
}

/**
 * 今回の記録で級が上がったかどうか。
 * 上がった瞬間だけお祝いを出したいので、記録前後の のべ日数を比べる。
 */
export function findNewlyUnlocked(previousTotal, nextTotal) {
  return (
    CERTIFICATIONS.find((cert) => previousTotal < cert.days && nextTotal >= cert.days) ?? null
  )
}
