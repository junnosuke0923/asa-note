<#
  ホーム画面のアイコンを、好きな絵に差し替えるための案内役。

  .bat に画像をドラッグ＆ドロップすると、その絵が渡ってくる。
  何も渡されなかったときは、その場で聞く。

  このファイルは UTF-8（BOMつき）で保存すること。
#>
param(
  [string]$Source = ''
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

Set-Location (Split-Path $PSScriptRoot -Parent)

function Say($text, $color = 'Gray') {
  Write-Host "  $text" -ForegroundColor $color
}

Write-Host ''
Write-Host '  ── ホーム画面のアイコンを変える ──' -ForegroundColor Cyan
Write-Host ''

if ([string]::IsNullOrWhiteSpace($Source)) {
  Say 'この黒い画面に、使いたい画像をドラッグ＆ドロップして' 'Yellow'
  Say 'Enterキーを押してください。' 'Yellow'
  Write-Host ''
  $Source = Read-Host '  画像'
}

$Source = $Source.Trim().Trim('"')

if ([string]::IsNullOrWhiteSpace($Source) -or -not (Test-Path $Source)) {
  Say 'その場所に画像が見つかりませんでした。' 'Red'
  Write-Host ''
  Read-Host '  Enterキーで閉じます'
  exit 1
}

Say '正方形に近い絵ほど きれいに収まります。' 'DarkGray'
Say '（Androidは 丸や四角に切り抜くので、絵は中央に寄せて作ります）' 'DarkGray'
Write-Host ''

try {
  & python scripts/make-icons.py "$Source"
} catch {
  Say '作成の途中で止まりました。' 'Red'
  Say $_.Exception.Message 'Red'
}

Write-Host ''
Read-Host '  おわりました。Enterキーで閉じます'
