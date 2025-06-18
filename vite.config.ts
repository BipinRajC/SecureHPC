import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_PORTS = [3001, 3002, 3003]; // Fallback ports to try

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        // Try alternative ports if the main one fails
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
            
            // Try alternative ports if the first one fails
            for (let i = 1; i < API_PORTS.length; i++) {
              const port = API_PORTS[i];
              console.log(`Trying alternative port: ${port}`);
              try {
                proxy.web(_req, _res, {
                  target: `http://localhost:${port}`,
                });
                return;
              } catch (error) {
                console.log(`Failed to connect to port ${port}:`, error);
              }
            }
          });
        }
      },
    },
  },
});
