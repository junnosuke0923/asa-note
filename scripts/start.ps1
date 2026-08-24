<#
  アプリを立ち上げるための案内役。

  ダブルクリックできる .bat から呼ばれる。
  バッチファイルは日本語の表示がこわれやすいので、
  画面に出す文字はこちら（PowerShell）で受け持っている。

  このファイルは UTF-8（BOMつき）で保存すること。
  BOMがないと、Windows標準のPowerShellが文字化けする。

  引数 -Mode dev  … 開発モード（絵とことばの編集画面つき）
  引数 -Mode use  … ふつうに使うモード（編集画面なし）
#>
param(
  [ValidateSet('dev', 'use')]
  [string]$Mode = 'dev'
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

# このファイルの1つ上（プロジェクトの場所）へ移動する
Set-Location (Split-Path $PSScriptRoot -Parent)

function Say($text, $color = 'Gray') {
  Write-Host "  $text" -ForegroundColor $color
}

Write-Host ''
Write-Host '  ── きそたいおん ──' -ForegroundColor Cyan
Write-Host ''

# Node.js が入っているか
try {
  $null = & node --version 2>$null
} catch {
  Say 'Node.js が見つかりませんでした。' 'Red'
  Say 'https://nodejs.org/ja からインストールしてください。' 'Red'
  Write-Host ''
  Read-Host '  Enterキーで閉じます'
  exit 1
}

# はじめての起動なら、必要なものを取ってくる
if (-not (Test-Path 'node_modules')) {
  Say 'はじめての起動です。準備をします。' 'Yellow'
  Say '数分かかります。そのままお待ちください…' 'Yellow'
  Write-Host ''
  & npm install
  Write-Host ''
}

if ($Mode -eq 'dev') {
  Say 'かいはつモードで ひらきます。' 'Cyan'
  Say '「せってい」→「絵と ことば（開発用）」から'
  Say '絵と ことばを 決められます。'
  Write-Host ''
  Say '決めたら「アプリに 焼きこむ」を押してください。' 'Yellow'
} else {
  Say 'アプリを ひらきます。' 'Cyan'
  Say '（編集画面は出ません。実際に使うときの見た目です）'
}

Write-Host ''
Say 'ブラウザが 自動でひらきます。少しお待ちください。'
Say 'おわるときは、この黒い画面を閉じてください。' 'DarkGray'
Write-Host ''

# --host を付けると、同じWi-Fiのスマホからも開ける（Network: の住所が出る）
if ($Mode -eq 'dev') {
  & npm run dev -- --open --host
} else {
  & npm run build
  & npm run preview -- --open --host
}

# サーバーが止まったとき、画面がすぐ消えないように
Write-Host ''
Read-Host '  おわりました。Enterキーで閉じます'
