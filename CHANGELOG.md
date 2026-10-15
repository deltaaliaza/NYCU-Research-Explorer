# Changelog｜版本歷程

依照 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) 方式紀錄主要異動。

## [Unreleased]

### Changed
- 網頁拆分為獨立 HTML、CSS、JavaScript 和五個 JSON 資料檔。
- 改由前端相對路徑讀取資料，適用 GitHub Pages 專案子路徑。
- 提供失敗提示，避免 JSON 遺失時畫面無回應。
- 本機儲存被封鎖時仍可繼續使用，不強制登入。

### Added
- 170 筆資料新增布林值 `display`（預設全部 `true`），可保留停訂紀錄並隱藏對外入口。
- 前端同步過濾停用的資料庫、全數停用的群組及沒有可用入口的共通工具，微任務遇到已停用主要資料庫時改用同群可見入口。
- 資料檢核新增 `display` 型別檢查、全隱藏群組警告與推薦群組最低數量檢查。
- 新增 8 項零套件 Node.js 回歸測試，GitHub Actions 部署前自動執行。
- JSON 關聯完整性檢核工具、GitHub Actions 自動驗證與部署。
- README、資料欄位規格、維護 SOP、議題回報範本與授權決策說明。

### Preserved
- 原有 170 筆資料、33 個平台群組、22 個教學單位、7 道問卷與原始推薦加權規則。

## [0.1.0] - 2026-10-15

- 由單檔 HTML 轉為模組化的靜態站台原型。