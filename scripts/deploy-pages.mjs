/*
 * 今のコードを、公開URL（GitHub Pages）に反映する。
 *
 * このリポジトリの main には、アプリの「ソース」だけを置いている。
 * 実際にスマホから開けるページは、別の枝（gh-pages）に置いた
 * ビルド結果（dist/ の中身）のほう。この2つを混ぜないための道具。
 *
 * 隣のフォルダ（../asa-note-pages）に gh-pages 専用の作業場を
 * 用意してある（git worktree）。無ければ、ここで新しく作る。
 */

import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pagesDir = join(root, '..', 'asa-note-pages')

/*
 * このパソコンのユーザー名（本名）を、Gitが作者名として
 * 自動で拾ってしまったことがあった。公開リポジトリなので、
 * それは避けたい。設定ファイルは変えず、コミットのたびに
 * その場だけ安全な名前を指定する。
 */
const GIT_IDENTITY =
  '-c user.name="junnosuke0923" -c user.email="251002352+junnosuke0923@users.noreply.github.com"'

function run(cmd, cwd) {
  execSync(cmd, { cwd, stdio: 'inherit' })
}

function runGit(cmd, cwd) {
  run(`git ${GIT_IDENTITY} ${cmd}`, cwd)
}

console.log('ビルドしています…')
run('npm run build', root)

if (!existsSync(join(pagesDir, '.git'))) {
  console.log('公開用の作業場が無いので、新しく用意します…')
  mkdirSync(dirname(pagesDir), { recursive: true })
  try {
    run(`git worktree add -B gh-pages "${pagesDir}" origin/gh-pages`, root)
  } catch {
    run(`git worktree add --orphan -b gh-pages "${pagesDir}"`, root)
  }
}

// 前回ぶんの古いファイルが残らないよう、いったん空にしてから書き出す
for (const name of ['assets', 'icons']) {
  rmSync(join(pagesDir, name), { recursive: true, force: true })
}
cpSync(join(root, 'dist'), pagesDir, { recursive: true })

runGit('add -A', pagesDir)

try {
  runGit('commit -m "公開用ビルド"', pagesDir)
} catch {
  console.log('前回から 変わったところが無いようです。書き出しは終わりにします。')
  process.exit(0)
}

runGit('push origin gh-pages', pagesDir)
console.log('\n公開しました → https://junnosuke0923.github.io/asa-note/')
