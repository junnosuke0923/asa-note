# -*- coding: utf-8 -*-
"""
好きな絵から、ホーム画面のアイコン一式を作る。

■ なぜ1枚から作るのか
アイコンは1種類では足りない。置き場所ごとに求められる形が違う。

  icon-192 / icon-512      ふつうのアイコン。角を丸くしておく
  icon-maskable-512        Android 用。端末が好きな形（丸・四角・雫）に
                           切り抜くので、絵は中央80%に収める必要がある。
                           はみ出す外側10%ぶんは 切られる前提で背景を敷く
  apple-touch-icon         iPhone 用。透明のところが黒くなるので、
                           かならず背景で埋めておく

■ 使いかた
  python scripts/make-icons.py <元にする画像>
"""

import hashlib
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw

# Windows のコマンド画面は既定が UTF-8 ではないので、日本語が化ける。
# 出力側を UTF-8 にそろえておく
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "icons"

# アプリと同じ色。左上のうすいピンクから、右下のクリーム色へ
BG_FROM = (255, 239, 242)
BG_TO = (255, 251, 230)

# 端末が切り抜いても絵が欠けない範囲（Android の決まりで中央80%）
MASKABLE_SAFE = 0.80


def make_background(size):
    """左上から右下への やわらかいグラデーション"""
    bg = Image.new("RGB", (size, size), BG_FROM)
    pixels = bg.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1)) if size > 1 else 0
            pixels[x, y] = (
                round(BG_FROM[0] + (BG_TO[0] - BG_FROM[0]) * t),
                round(BG_FROM[1] + (BG_TO[1] - BG_FROM[1]) * t),
                round(BG_FROM[2] + (BG_TO[2] - BG_FROM[2]) * t),
            )
    return bg.convert("RGBA")


def fit(art, box):
    """縦横の比を保ったまま、box×box に収まる大きさへ"""
    copy = art.copy()
    copy.thumbnail((box, box), Image.LANCZOS)
    return copy


def compose(art, size, scale, rounded):
    """背景の上に絵を中央ぞろえで置く。rounded なら角を丸くする"""
    canvas = make_background(size)
    placed = fit(art, round(size * scale))
    canvas.alpha_composite(
        placed,
        ((size - placed.width) // 2, (size - placed.height) // 2),
    )

    if rounded:
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle(
            (0, 0, size - 1, size - 1), radius=round(size * 0.22), fill=255
        )
        canvas.putalpha(mask)

    return canvas


def stamp_version():
    """
    アイコンの住所に、中身から作った版番号を付ける。

    ■ なぜ必要か
    Android は「ホーム画面に追加」したとき、アイコンを焼きこんだ
    小さなアプリ（WebAPK）を端末の中に作る。それを作り直すかどうかは
    manifest.webmanifest の中身が変わったかどうかで決めている。

    絵だけ差し替えても、住所（icons/icon-192.png）は同じままなので
    manifest は1文字も変わらない。すると Android は「変更なし」と判断し、
    入れ直しても 古いアイコンを使い続けてしまう。

    そこで住所のうしろに ?v=<中身のハッシュ> を付ける。
    絵を変えれば ハッシュも変わり、manifest も変わるので
    Android が ちゃんと作り直す。
    絵が同じなら ハッシュも同じなので、余計な更新は起きない。
    """
    digest = hashlib.md5()
    for name in sorted(path.name for path in OUT_DIR.glob("*.png")):
        digest.update((OUT_DIR / name).read_bytes())
    version = digest.hexdigest()[:8]

    manifest_path = ROOT / "public" / "manifest.webmanifest"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    for icon in manifest.get("icons", []):
        icon["src"] = icon["src"].split("?")[0] + f"?v={version}"
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    # iPhone 用の1枚は index.html から直接 読まれている
    index_path = ROOT / "index.html"
    html = index_path.read_text(encoding="utf-8")
    html = re.sub(
        r'(href="\./icons/apple-touch-icon\.png)(\?v=[0-9a-f]+)?"',
        rf'\1?v={version}"',
        html,
    )
    index_path.write_text(html, encoding="utf-8")

    print(f"  版番号: v={version}（絵が変わったことが 端末に伝わります）")
    return version


def main():
    # 絵はそのままで、版番号だけ打ち直したいとき
    if len(sys.argv) >= 2 and sys.argv[1] == "--stamp-only":
        stamp_version()
        return 0

    if len(sys.argv) < 2:
        print("元にする画像を指定してください。")
        print("  例: python scripts/make-icons.py C:\\Users\\...\\myicon.png")
        return 1

    source = Path(sys.argv[1].strip('"'))
    if not source.exists():
        print(f"見つかりませんでした: {source}")
        return 1

    art = Image.open(source).convert("RGBA")
    print(f"元の絵: {source.name}（{art.width}×{art.height}）")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # (ファイル名, 大きさ, 絵の占める割合, 角を丸くするか, 透明を許すか)
    jobs = [
        ("icon-192.png", 192, 0.72, True, True),
        ("icon-512.png", 512, 0.72, True, True),
        ("icon-maskable-512.png", 512, MASKABLE_SAFE * 0.82, False, False),
        ("apple-touch-icon.png", 180, 0.72, False, False),
    ]

    for name, size, scale, rounded, keep_alpha in jobs:
        icon = compose(art, size, scale, rounded)
        if not keep_alpha:
            # 透明を残すと iPhone で黒くなる。背景に焼きつける
            flat = make_background(size)
            flat.alpha_composite(icon)
            icon = flat.convert("RGB")
        icon.save(OUT_DIR / name)
        print(f"  作成: {name}（{size}×{size}）")

    stamp_version()

    # このあと公開するかどうかは、呼び出し元（make-icons.ps1）が聞く
    print("\nできました。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
