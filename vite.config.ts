import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // ▼▼▼ [매우 중요] 여기에 깃허브 저장소 이름을 적어야 합니다! ▼▼▼
  // 예: https://github.com/myname/career-ai 라면 -> '/career-ai/'
  // 만약 저장소 이름이 package.json에 있는 "finish_future-career-ai"라면 그대로 두세요.
  base: '/ai_semiconductor_jinro/', 
  
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },

  // 아까 geminiService.ts에 키를 직접 적었으니, 
  // define 설정은 더 이상 필요 없습니다. 깔끔하게 지웠습니다.
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
