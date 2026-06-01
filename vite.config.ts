import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    {
      name: 'serve-root-index',
      configureServer(server) {
        server.middlewares.use((request, _response, next) => {
          const rootRequest = request as { url?: string };

          if (rootRequest.url === '/') {
            rootRequest.url = '/index.html';
          }

          next();
        });
      },
    },
    react(),
  ],
});
