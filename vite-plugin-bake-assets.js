import { exec } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

/*
 * 「絵と ことば」を、アプリ本体に焼きこむための開発用の仕組み。
 *
 * 編集画面はあくまで開発用の道具で、できあがったアプリには出さない。
 * かわりに、ここで受け取った内容を src/data/appAssets.js に書き出して
 * アプリの中身そのものにしてしまう。
 *
 * 開発中（npm run dev）だけ動く。本番のビルドには一切含まれない。
 *
 * 焼きこみに続けて、そのまま公開（npm run deploy）まで
 * 進められる道も用意してある。ちょっとした直しのときに、
 * 別のバットファイルを探しに行かなくて済むように。
 */

const TARGET = 'src/data/appAssets.js'
const ENDPOINT = '/__bake-assets'
const PUBLISH_ENDPOINT = '/__publish'
const MAX_BODY = 24 * 1024 * 1024

const HEADER = `/*
 * このファイルは「絵と ことば」の編集画面から自動で書き出されます。
 * 手で書きかえても構いませんが、焼きこみを実行すると上書きされます。
 *
 * bakedDecorations … 各画面に出るかざりの絵（場所の名前 → 画像データ）
 * bakedCheerSets   … お祝いのセット（絵＋ことばの組）。
 *                    null なら cheerMessages.js の初期値を ことばだけで使う
 */
`

const GROUPS = ['normal', 'tough', 'streak', 'comeback']

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []

    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY) {
        reject(new Error('大きすぎます'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

export default function bakeAssets() {
  return {
    name: 'bake-assets',
    apply: 'serve',

    configureServer(server) {
      server.middlewares.use(ENDPOINT, async (req, res, next) => {
        if (req.method !== 'POST') return next()

        try {
          const { decorations, cheerSets } = JSON.parse(await readBody(req))

          // 受け取ったものを検査する。おかしな値をソースに書きこまないため
          const isImage = (v) => typeof v === 'string' && v.startsWith('data:image/')

          const safeDecorations = {}
          for (const [slot, dataUrl] of Object.entries(decorations ?? {})) {
            if (/^[a-z]+$/.test(slot) && isImage(dataUrl)) safeDecorations[slot] = dataUrl
          }

          const safeSets = Array.isArray(cheerSets)
            ? cheerSets
                .filter(
                  (s) =>
                    s &&
                    typeof s.text === 'string' &&
                    s.text.trim() !== '' &&
                    GROUPS.includes(s.category),
                )
                .map((s) => ({
                  category: s.category,
                  text: s.text,
                  image: isImage(s.image) ? s.image : null,
                }))
            : null

          const source =
            HEADER +
            '\nexport const bakedDecorations = ' +
            JSON.stringify(safeDecorations, null, 2) +
            '\n\nexport const bakedCheerSets = ' +
            (safeSets && safeSets.length > 0 ? JSON.stringify(safeSets, null, 2) : 'null') +
            '\n'

          writeFileSync(resolve(server.config.root, TARGET), source, 'utf8')

          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              ok: true,
              decorations: Object.keys(safeDecorations).length,
              sets: safeSets?.length ?? 0,
              file: TARGET,
            }),
          )
        } catch (error) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: false, error: String(error.message ?? error) }))
        }
      })

      server.middlewares.use(PUBLISH_ENDPOINT, async (req, res, next) => {
        if (req.method !== 'POST') return next()

        // 組み立て・送信で数十秒かかるため、待っているあいだも
        // 画面じたいは固まらないよう、非同期のexecで動かす
        exec(
          'node scripts/deploy-pages.mjs',
          { cwd: server.config.root, maxBuffer: 10 * 1024 * 1024 },
          (error, stdout, stderr) => {
            res.setHeader('Content-Type', 'application/json')
            const log = stdout + stderr

            if (error) {
              res.statusCode = 500
              res.end(JSON.stringify({ ok: false, error: '公開の途中で止まりました。', log }))
              return
            }

            res.end(JSON.stringify({ ok: true, published: log.includes('公開しました'), log }))
          },
        )
      })
    },
  }
}
