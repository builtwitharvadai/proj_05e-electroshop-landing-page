import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  base: '/',
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          
          if (/png|jpe?g|svg|gif|webp|avif/i.test(ext)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          if (/css/i.test(ext)) {
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    
    cssCodeSplit: true,
    
    assetsInlineLimit: 4096,
    
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
      format: {
        comments: false,
      },
    },
    
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500,
    
    sourcemap: false,
  },
  
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    open: false,
    cors: true,
    
    hmr: {
      overlay: true,
    },
  },
  
  preview: {
    port: 4173,
    strictPort: false,
    host: true,
    open: false,
    cors: true,
  },
  
  css: {
    devSourcemap: true,
    
    postcss: {
      plugins: [],
    },
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@scripts': resolve(__dirname, 'src/scripts'),
    },
    extensions: ['.js', '.json', '.css'],
  },
  
  optimizeDeps: {
    include: [],
    exclude: [],
  },
  
  publicDir: 'public',
  
  logLevel: 'info',
  clearScreen: true,
});