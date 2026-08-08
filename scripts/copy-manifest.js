import { copyFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 将 HBuilderX manifest.json 复制到 dist/ 目录
copyFileSync(
  join(__dirname, '..', 'manifest.json'),
  join(__dirname, '..', 'dist', 'manifest.json')
)

// 复制图标到 dist/
copyFileSync(
  join(__dirname, '..', 'public', 'icon-192.svg'),
  join(__dirname, '..', 'dist', 'icon-192.svg')
)
copyFileSync(
  join(__dirname, '..', 'public', 'icon-512.svg'),
  join(__dirname, '..', 'dist', 'icon-512.svg')
)

console.log('HBuilderX manifest.json and icons copied to dist/')
