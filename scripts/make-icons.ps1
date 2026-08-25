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

$made = $false
try {
  & python scripts/make-icons.py "$Source"
  $made = ($LASTEXITCODE -eq 0)
} catch {
  Say '作成の途中で止まりました。' 'Red'
  Say $_.Exception.Message 'Red'
}

<#
  作っただけでは スマホ側は前のままなので、その場で聞く。
  「あとで 3 を実行してください」と書いておくだけでは
  見落とされて「変わらない」と思われてしまう。
#>
if ($made) {
  Write-Host ''
  Say 'このままだと スマホ側は まだ前のアイコンのままです。' 'Yellow'
  $answer = Read-Host '  いま公開しますか？（y / n）'

  if ($answer -match '^[yY]') {
    Write-Host ''
    Say '公開しています…30秒ほど かかります。'
    Write-Host ''
    try {
      & npm run deploy
      Write-Host ''
      Say 'できました。' 'Green'
      Say 'スマホでは いったんアイコンを長押しして削除し、' 'Green'
      Say 'もう一度「ホーム画面に追加」してください。' 'Green'
    } catch {
      Say '公開の途中で止まりました。' 'Red'
    }
  } else {
    Write-Host ''
    Say 'あとで「3_スマホ用に公開する.bat」を実行してください。' 'Yellow'
  }
}

Write-Host ''
Read-Host '  おわりました。Enterキーで閉じます'
