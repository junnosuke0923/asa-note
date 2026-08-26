import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import bakeAssets from './vite-plugin-bake-assets.js'

/*
 * このアプリ専用の住所（ポート番号）を決めておく。
 *
 * 既定のままだと、どのアプリも まず 5173 を取りにいく。
 * 先に別のアプリが取っていると、こちらは黙って 5174、5175… と
 * 隣へずれる。エラーは出ないので気づけず、
 * 「いつもの localhost:5173」を開くと 別のアプリが出てくる、
 * ということが実際に起きた。
 *
 * strictPort を付けると、ずれる代わりに はっきり止まる。
 * 黙って別物を見せられるより、止まって教えてくれるほうがよい。
 */
const DEV_PORT = 5273
const PREVIEW_PORT = 5274

// https://vite.dev/config/
export default defineConfig({
  // 置き場所が変わっても動くよう、読み込み先を相対パスにする
  base: './',
  // bakeAssets は開発中だけ動く（絵とことばをソースに焼きこむ道具）
  plugins: [react(), tailwindcss(), bakeAssets()],
  server: { port: DEV_PORT, strictPort: true },
  preview: { port: PREVIEW_PORT, strictPort: true },
})
