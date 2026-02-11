
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // base: './' を削除し、デフォルトのルートパス設定を使用します。
  // これによりMIME typeエラーやパス解決の問題を防ぎます。
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 3000,
  }
});
