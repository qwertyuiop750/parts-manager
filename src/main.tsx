import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// HBuilderX 5+ API 初始化
function setupPlus() {
  // @ts-ignore - plus is defined in HBuilderX runtime
  if (typeof plus === 'undefined') return

  // @ts-ignore
  const p = plus

  // 状态栏配置
  try {
    p.navigator.setStatusBarStyle('dark')
    p.navigator.setStatusBarBackground('#0a0a1a')
  } catch (e) {
    console.warn('StatusBar setup failed:', e)
  }

  // Android 物理返回键
  p.key.addEventListener('backbutton', () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      // 在首页，提示退出
      p.runtime.quit()
    }
  })
}

// 等待 plus ready 后渲染
function init() {
  // @ts-ignore
  if (typeof plus !== 'undefined') {
    // @ts-ignore
    plus.ready(() => {
      setupPlus()
      createRoot(document.getElementById('root')!).render(
        <StrictMode>
          <App />
        </StrictMode>,
      )
    })
  } else {
    // Web 环境直接渲染
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  }
}

init()
