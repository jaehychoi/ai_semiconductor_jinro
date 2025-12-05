import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // ▼▼▼ 여기가 틀려서 안 됐던 겁니다! 사진에 있는 저장소 이름으로 고쳤습니다. ▼▼▼
  base: '/ai_semiconductor_jinro/', 
  
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
