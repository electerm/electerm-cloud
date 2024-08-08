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
        app: resolve(cwd, 'src/client/entry/app.tsx'),
        admin: resolve(cwd, 'src/client/entry/admin.tsx')
      },
      external: [
        'universe-bg',
        'three'
      ],
      output: {
        inlineDynamicImports: false,
        manualChunks: {
          'react-dom': ['react-dom'],
          dayjs: ['dayjs'],
          'ant-icons': ['@ant-design/icons'],
          react: ['react']
        },
        format: 'esm',
        entryFileNames: `js/[name].bundle.js`,
        chunkFileNames: 'chunks/[name].[hash].bundle.js',
        assetFileNames: chunkInfo => {
          const { name = '' } = chunkInfo
          return name.endsWith('.css')
            ? `css/${name}`
            : `images/${name}`
        },
        dir: resolve(cwd, 'public')
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(cwd, './src')
    }
  }
})
