# 📸 PhotoCalorie AI - Intelligent Macro Tracker

[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.io/)

> **PhotoCalorie** 是一款基於 AI 視覺技術的智能飲食紀錄應用程式。只需拍一張照片，AI 即可自動分析食物成分並紀錄每日營養攝取。

## ✨ 核心功能 (Core Features)

*   **🥗 AI 視覺掃描 (AI Vision Scan)**：利用 OpenAI GPT-4 Vision 技術，即時從照片中辨識食物、估算重量並提取營養數據（熱量、蛋白質、碳水、脂肪）。
*   **📱 行動端原生體驗 (Native Mobile Experience)**：針對 iOS/Android 深度優化，支援 PWA（進階版網頁應用），可一鍵安裝至桌面。
*   **🛠️ 靈活紀錄管理 (Log Management)**：支援手動新增紀錄，並提供完整的編輯與刪除功能，確保數據精確無誤。
*   **📊 營養儀錶板 (Nutrition Dashboard)**：直觀的圓環圖示，即時監控每日攝取目標與達成率。
*   **⚡ 極速反應 (High Performance)**：使用 Vite + React 構建，極致流暢的 UI 互動與微動畫。

## 🛠️ 技術棧 (Tech Stack)

*   **前端 (Frontend)**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion (動畫).
*   **後端/資料庫 (Backend/Database)**: Supabase (PostgreSQL, Auth, Storage).
*   **AI 核心 (AI Engine)**: OpenAI GPT-4o-mini Vision API.
*   **部署 (Deployment)**: Vercel / GitHub Actions.

## 🚀 快速開始 (Quick Start)

### 1. 複製專案
```bash
git clone https://github.com/RK-group-coder/photo-calorie.git
cd photo-calorie
```

### 2. 安裝依賴
```bash
npm install
```

### 3. 設定環境變數
在根目錄建立 `.env` 檔案並填入您的金鑰：
```env
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_OPENAI_API_KEY=YOUR_OPENAI_API_KEY
```

### 4. 啟動開發環境
```bash
npm run dev
```

## 📸 介面展示 (Preview)

*   **掃描頁面**: 高科技感取景框，直連手機原生攝影機。
*   **分析結果**: 詳細的食材拆解與營養評語。
*   **紀錄列表**: 支援卡片式滑動與快速編輯。

## ⚠️ 注意事項 (Notes)

*   **相機權限**: 由於瀏覽器安全政策，即時相機功能僅能在 **HTTPS** 環境下運作。部署至 Vercel 後即可正常操作。
*   **瀏覽器相容性**: 在行動裝置上，建議在 Safari (iOS) 或 Chrome (Android) 中開啟以獲得最佳 PWA 體驗。

---

## 👨‍💻 作者 (Author)
**RKCode / RK-group-coder**

---
Licensed under the [MIT License](LICENSE).
