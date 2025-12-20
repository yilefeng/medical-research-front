import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // 🔴 必须导入path（否则@别名会失效）

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    open: true,
    cors: true, // 🔴 显式开启前端自身跨域（兜底）
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true, // 保持true（伪装请求来源为后端地址，适配跨域）
        rewrite: (path) => path.replace(/^\/api/, '/api'), // 这行等价于无操作，可删除
        onProxyReq: (proxyReq, req, res) => {
          // 仅设置必要头信息，不修改请求体（关键！）
          proxyReq.setHeader('Origin', 'http://localhost:8080'); // 🔴 改为后端地址（适配changeOrigin: true）
          proxyReq.setHeader('Content-Type', 'application/json;charset=utf-8');

          // 🔴 新增：打印代理前的原始请求体（排查是否嵌套）
          const body = req.body;
          console.log('Vite代理接收的原始请求体：', body);
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src') // 确保path已导入
    }
  }
})