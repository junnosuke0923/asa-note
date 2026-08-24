<#
  絵とことばを焼きこんだあと、スマホ用の公開URLに反映するための案内役。

  このファイルは UTF-8（BOMつき）で保存すること。
  BOMがないと、Windows標準のPowerShellが文字化けする。
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

Set-Location (Split-Path $PSScriptRoot -Parent)

function Say($text, $color = 'Gray') {
  Write-Host "  $text" -ForegroundColor $color
}

Write-Host ''
Write-Host '  ── きそたいおん：スマホ用に公開 ──' -ForegroundColor Cyan
Write-Host ''
Say 'いまの内容を、組み立てなおして送りだします。'
Say '終わったら、スマホのアイコンから開きなおすと反映されています。'
Write-Host ''

try {
  & npm run deploy
} catch {
  Write-Host ''
  Say '途中で止まりました。エラーの内容を確認してください。' 'Red'
}

Write-Host ''
Read-Host '  おわりました。Enterキーで閉じます'
