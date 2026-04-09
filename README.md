# 📸 PhotoCalorie AI - Engineering Showcase

> **High-Fidelity AI Nutrition Scanner & PWA Dashboard**
> 
> 這是一款結合 **Generative AI** 與 **Cloud Native** 架構的現代化飲食管理系統，專為追求極致效能與跨端體驗的用戶設計。

## 🔐 快速體驗帳號 (Demo Account)
若您是面試官或業主，可直接使用以下測試帳號登入系統體驗：
*   **Email**: `TEST001@gmail.com`
*   **Password**: `12345678`

## 🚀 核心新功能 (Core Feature Updates)

本應用程式近期已完成以下重大功能更新：

*   **⚡ 智慧拍照備援系統**：實作了 `capture="environment"` 硬件直連技術，確保在所有手機瀏覽器（含 Messenger/LINE）中都能穩定開啟攝影機。
*   **✏️ 全營養要素編輯**：用戶可對任何一筆歷史紀錄進行「微調」，支援同時修改 **熱量 (kcal)、蛋白質 (g)、碳水 (g) 與脂肪 (g)**。
*   **🗑️ 動態紀錄管理**：支援即時刪除誤記內容，並與 Supabase PostgreSQL 資料庫同步更新。
*   **🍱 手動補錄模式**：提供彈窗式輸入介面，方便用戶在無法拍照時手動補錄飲食內容。
*   **🔍 大視野取景優化**：掃描框擴大至 **92% 螢幕寬度**，並優化了角落對焦視覺設計，提供更沉浸的攝影體體。

### 🧩 前端核心 (Frontend Core)
*   **語言 (Language)**: `TypeScript` (嚴謹型態檢查，確保大型組件低報錯率)
*   **框架 (Framework)**: `React 18` (使用 Hooks API 與 Functional Components)
*   **建構工具 (Build Tool)**: `Vite` (實現毫秒級 HMR 與極速打包)
*   **封裝平台 (Wrapper)**: `Capacitor` (支援將網頁應用封裝成 iOS/Android 原生 App)

### 🎨 介面開發 (UI/UX)
*   **樣式控制 (Styling)**: `Tailwind CSS` (實現原子化 CSS 排版)
*   **組件庫 (Components)**: `shadcn/ui` (基於 Radix UI 的專業級無障礙組件)
*   **動畫引擎 (Animation)**: `Framer Motion` (渲染 60fps 的流暢轉場與微互動)
*   **圖表系統 (Charts)**: `Recharts` (數據視覺化展示)

### ☁️ 後端與 AI 整合 (Cloud & AI)
*   **雲端平台 (BaaS)**: `Supabase` (全方位整合 PostgreSQL 資料庫與 Auth 驗證系統)
*   **資料庫 (Database)**: `PostgreSQL` (結構化存儲用戶每日營養數據)
*   **AI 引擎 (AI Engine)**: `OpenAI GPT-4o-mini Vision` (執行多模態圖片分析與熱量估算)
*   **驗證系統 (Auth)**: `Supabase Auth` (支援安全用戶登入與會話保持)

## 📊 專案亮點 (Project Highlights)

1.  **直接硬體呼叫 (Native Camera Access)**:
    實作了原生的 `capture="environment"` 呼叫機制，在限制嚴格的行動端瀏覽器中也能 100% 成功開啟相機。

2.  **多模態 AI 辨識 (Multimodal AI Implementation)**:
    不僅辨識食物名稱，更實作了食材拆解（Ingredients Decomposition）算法，能精準計算蛋白質、碳水與脂肪比例。

3.  **PWA 進階優化 (Progressive Web App)**:
    完整支援 Service Workers 與 Web App Manifest，讓網頁應用具備「離線提示」與「一鍵安裝至桌面」的功能。

## 🚀 開發指令 (Development)

```bash
# 安裝
npm install

# 本地運行
npm run dev

# 生產環境打包
npm run build
```

---

## 📜 專案結構 (Architecture)
*   `src/App.tsx`: 核心控制中心 (Main Controller)
*   `src/lib/supabase.ts`: 雲端連接配置 (Backend Connector)
*   `src/index.css`: 全域 Design System (Style Engine)

---
**Developed by RKCode**
