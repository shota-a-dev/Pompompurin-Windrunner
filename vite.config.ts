import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // GitHub Pages等へのデプロイを考慮
  server: {
    host: true, // 同一ネットワーク内のスマホからアクセス可能にする
    port: 3000
  },
  build: {
    assetsInlineLimit: 0, // アセットをインライン化せずファイルとして保持
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  }
});
