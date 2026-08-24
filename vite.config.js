import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import bakeAssets from './vite-plugin-bake-assets.js'

// https://vite.dev/config/
export default defineConfig({
  // 置き場所が変わっても動くよう、読み込み先を相対パスにする
  base: './',
  // bakeAssets は開発中だけ動く（絵とことばをソースに焼きこむ道具）
  plugins: [react(), tailwindcss(), bakeAssets()],
})
