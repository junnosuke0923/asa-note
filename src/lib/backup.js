/*
 * 記録の書き出しと読み込み。
 *
 * ブラウザの保存領域は、履歴の削除やアプリの入れ直しで消える。
 * 数か月ぶんの記録が一瞬で消えるのを防ぐため、
 * ファイルとして手元に残せるようにしておく。
 *
 * 通信は一切しない。ファイルはこの端末の中で作って、この端末に保存される。
 */

import { todayKey } from './dateUtils'

const FORMAT = 'kiso-taion-backup'
const FORMAT_VERSION = 2

export function buildBackup(records, treatments, settings) {
  return {
    format: FORMAT,
    version: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    recordCount: Object.keys(records).length,
    records,
    treatments,
    settings,
  }
}

/*
 * ファイルを渡す方法は、どこで動いているかで変わる。
 *
 *  ・ふつうのブラウザ（この端末で開いたアプリ）… リンクを作って保存
 *  ・公開ページ（Artifact）の中 … ページから直接は保存できない決まりなので、
 *    用意された保存の仕組みに渡して、閲覧者に確認してもらう
 *
 * 呼び出す側がどちらか気にしなくていいよう、ここで吸収する。
 */
async function offerFile(filename, text, mimeType) {
  const downloads = window.claude?.use ? await window.claude.use('downloads') : null

  if (downloads) {
    try {
      await downloads.save({ filename, data: text })
      return { ok: true }
    } catch (error) {
      return { ok: false, code: error?.code ?? 'unavailable' }
    }
  }

  const url = URL.createObjectURL(new Blob([text], { type: mimeType }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // すぐ消すと保存前に無効になる端末があるため、少し待ってから解放する
  setTimeout(() => URL.revokeObjectURL(url), 1000)

  return { ok: true }
}

/** 保存できなかった理由を、そのまま画面に出せる日本語にする */
export function describeSaveError(code) {
  switch (code) {
    case 'declined':
      return '保存を とりやめました。'
    case 'extension_not_enabled':
      return 'この画面では CSV を保存できません。JSONで書き出してください。'
    case 'too_large':
      return '記録が大きすぎて保存できませんでした。'
    case 'rate_limited':
      return '少し待ってから もう一度おしてください。'
    default:
      return '保存できませんでした。'
  }
}

export async function downloadBackup(records, treatments, settings) {
  const payload = buildBackup(records, treatments, settings)
  const result = await offerFile(
    `基礎体温_${todayKey()}.json`,
    JSON.stringify(payload, null, 2),
    'application/json',
  )

  return { ...result, recordCount: payload.recordCount }
}

/**
 * 読み込んだファイルの中身を確かめる。
 * 全部を上書きする操作なので、形が違うものは受け付けない。
 */
export function parseBackup(text) {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'ファイルの中身が読み取れませんでした。' }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'ファイルの形が違うようです。' }
  }

  if (parsed.format !== FORMAT) {
    return {
      ok: false,
      error: 'このアプリで書き出したファイルではないようです。',
    }
  }

  const records = parsed.records
  if (!records || typeof records !== 'object' || Array.isArray(records)) {
    return { ok: false, error: '記録が入っていないファイルです。' }
  }

  const dateKeys = Object.keys(records).filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key))

  return {
    ok: true,
    records,
    treatments:
      parsed.treatments && typeof parsed.treatments === 'object' ? parsed.treatments : {},
    settings: parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : null,
    recordCount: dateKeys.length,
    exportedAt: parsed.exportedAt ?? null,
  }
}

/** CSV でも出せるようにしておく（表計算ソフトで見たいとき用） */
export async function downloadCsv(records) {
  const header = ['日付', '時刻', '体温', '月経', '経血量', 'タグ', '体重', 'メモ']
  const rows = Object.keys(records)
    .sort()
    .map((key) => {
      const r = records[key]
      return [
        key,
        r.time ?? '',
        r.temperature ?? '',
        r.period ? 'あり' : '',
        r.flow ?? '',
        r.tags.join(' '),
        r.weight ?? '',
        r.memo.replace(/"/g, '""'),
      ]
    })

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell)}"`).join(','))
    .join('\r\n')

  // Excel で開いたときに文字化けしないよう BOM を付ける
  const result = await offerFile(
    `基礎体温_${todayKey()}.csv`,
    '﻿' + csv,
    'text/csv;charset=utf-8',
  )

  return { ...result, rowCount: rows.length }
}
