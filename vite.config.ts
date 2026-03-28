import { defineConfig } from 'vite';
import { execSync } from 'child_process';

function resolveVersion(): string {
  try {
    // 直近のタグを取得（例: v1.2.3）
    const tag = execSync('git describe --tags --abbrev=0').toString().trim();
    return tag.replace(/^v/, '');
  } catch (e) {
    try {
      // タグがない場合はコミットの短いハッシュを取得
      const sha = execSync('git rev-parse --short HEAD').toString().trim();
      return sha;
    } catch (e2) {
      // 最終フォールバックは package.json の version
      return process.env.npm_package_version || '0.0.0';
    }
  }
}

const APP_VERSION = resolveVersion();

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION)
  },
  base: '/Pompompurin-Windrunner/', // GitHub Pages等へのデプロイを考慮
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
