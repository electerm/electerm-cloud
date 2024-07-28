import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import htmlPurge from 'vite-plugin-purgecss'
import { cwd } from './common'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // htmlPurge(),
    react({ include: /\.(mdx|js|jsx|ts|tsx|mjs)$/ })
  ],
  publicDir: false,
  // css: {
  //   codeSplit: false
  // },
  build: {
    cssCodeSplit: false,
    outDir: resolve(cwd, 'public'),
    rollupOptions: {
      input: {
        app: resolve(cwd, 'src/client/entry/app.tsx')
      },
      external: [
        'react',
        'react-dom',
        'universe-bg',
        'three'
      ],
      output: {
        format: 'umd',
        entryFileNames: `[name].bundle.js`,
        chunkFileNames: '[name].[hash].bundle.js',
        assetFileNames: `[name].bundle[extname]`,
        dir: resolve(cwd, 'public'),
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'universe-bg': 'UniverseBg',
          three: 'THREE'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(cwd, './src')
    }
  }
})
