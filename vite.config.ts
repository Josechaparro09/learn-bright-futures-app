import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5555,
  },
  plugins: [
    react(),
    svgr({
      // Optimize SVG imports
      include: "**/*.svg?react",
    }),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable source maps for debugging in production
    sourcemap: mode === 'development',
    // Use esbuild for faster minification
    minify: 'esbuild',
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks(id) {
          // Vendor chunks for better caching
          if (id.includes('node_modules')) {
            // Large libraries get their own chunks
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'radix-vendor';
            }
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'charts-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            if (id.includes('@supabase') || id.includes('@tanstack')) {
              return 'data-vendor';
            }
            if (id.includes('lucide-react') || id.includes('@radix-ui/react-icons')) {
              return 'icons-vendor';
            }
            // Other vendor dependencies
            return 'vendor';
          }
          
          // Split large application chunks
          if (id.includes('/pages/')) {
            return 'pages';
          }
          if (id.includes('/components/ui/')) {
            return 'ui-components';
          }
          if (id.includes('/components/')) {
            return 'components';
          }
        },
        // Optimize chunk naming for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Increase chunk size warning limit since we're splitting chunks
    chunkSizeWarningLimit: 1000,
    // Enable tree shaking
    target: 'esnext',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react',
    ],
    exclude: [
      // Exclude large optional dependencies that aren't always needed
      'framer-motion',
      'recharts',
    ],
  },
}));
