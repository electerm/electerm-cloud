import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cwd } from './common'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({ include: /\.(mdx|js|jsx|ts|tsx|mjs)$/ })
  ],
  publicDir: false,
  css: {
    preprocessorMaxWorkers: 0
  },
  build: {
    cssCodeSplit: false,
    outDir: resolve(cwd, 'public'),
    rolldownOptions: {
      input: {
        app: resolve(cwd, 'src/client/entry/app.tsx'),
        admin: resolve(cwd, 'src/client/entry/admin.tsx')
      },
      external: [
        'universe-bg',
        'three'
      ],
      output: {
        codeSplitting: {
          groups: [
            {
              test: /node_modules\/react-dom/,
              name: 'react-dom'
            },
            {
              test: /node_modules\/dayjs/,
              name: 'dayjs'
            },
            {
              test: /node_modules\/@ant-design\/icons/,
              name: 'ant-icons'
            },
            {
              test: /node_modules\/react/,
              name: 'react'
            }
          ]
        },
        format: 'esm',
        entryFileNames: 'js/[name].bundle.js',
        chunkFileNames: 'chunks/[name].[hash].bundle.js',
        assetFileNames: (chunkInfo: any) => {
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
