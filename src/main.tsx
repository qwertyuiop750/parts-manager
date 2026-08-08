import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { App as CapacitorApp } from '@capacitor/app'
import App from './App'
import './index.css'

// 原生平台：配置状态栏 + Android 返回键
async function setupNative() {
  if (!Capacitor.isNativePlatform()) return
  try {
    // 关键：不让 WebView 延伸到状态栏下方
    await StatusBar.setOverlaysWebView({ overlay: false })
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#1e293b' })
  } catch (e) {
    console.warn('StatusBar setup failed:', e)
  }

  // Android 物理返回键：优先 history.back，主页则退出
  CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
    } else {
      CapacitorApp.exitApp()
    }
  })
}

// 等待原生配置完成后再渲染
async function init() {
  await setupNative()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

init()
