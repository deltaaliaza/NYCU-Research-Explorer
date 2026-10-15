# GitHub 專案欄位、選項與上線操作

## 建立儲存庫時可直接填寫

| GitHub 欄位 | 建議內容 |
| --- | --- |
| Repository name | `nycu-research-explorer` |
| Description（英文） | `A JSON-driven, static research resource explorer with explainable 3+2+1 recommendations for NYCU learning and research.` |
| 專案簡述（中文） | `國立陽明交通大學研究資源探索原型：7 題引導、3＋2＋1 平台推薦、可維護 JSON 資源清單。` |
| Topics | `academic-libraries`, `research-tools`, `github-pages`, `json`, `education`, `library-services`, `static-website`, `nycu` |
| Website | 部署完成後填入 GitHub Pages 提供的實際網站 URL |
| Visibility | 原始資料允許公開時選 Public；若需先內部審查，請暫存為 Private，但是否可使用 GitHub Pages 取決於方案與設定 |
| Add a README | 上傳包已有 `README.md`；建立時可不另自動產生 |
| Add .gitignore | 上傳包已有 `.gitignore`；建立時可不另自動產生 |
| Choose a license | **暫時不選擇**；先確認程式及機構資料再散布權利，參見 `LICENSE_DECISION.md` |

## 建議開啟的儲存庫功能

- **Issues**：收集故障、資料庫名稱或連結更新建議，附兩種 Issue 範本。
- **Actions**：已附自動檢查／部署流程。首次運作前，確認儲存庫允許 GitHub Actions。
- **Pages**：選 `GitHub Actions` 做為發佈來源（**不要同時設定「從分支部署」當作同一套流程**）。
- **Discussions**：若未規劃公開討論區，可先關閉。
- **Wiki**：目前已有 `docs/`，可以先關閉避免維護兩份文件。
- **Private vulnerability reporting**：如有管理權限，建議開啟並提供安全問題回報管道。

## 手動上傳操作

1. 建立空白儲存庫（上傳包已包含 README 與 GitHub 設定檔）。
2. 解壓縮專案 ZIP，進入資料夾全選檔案與資料夾，上傳到 GitHub `main` 根目錄；**不要只上傳 ZIP 本身**，也不要多包一層 `nycu-research-explorer/` 資料夾。
3. 特別確認 `.github/workflows/deploy.yml`、`.nojekyll` 與 `data/*.json` 都有上傳。由於這是隱藏檔／資料夾，在部分作業系統需要顯示隱藏項目。
4. 到 Settings → Pages → Source 選 `GitHub Actions`。
5. 查看 Actions 中 `Validate and deploy GitHub Pages` 的執行結果。
6. 開啟 Pages 網址，依資料維護 SOP 執行抽樣操作。
7. 首次對外公開前，完成資料來源與機構名稱使用審查。

## 發布第一版（Release）

建議版本：`v0.1.0`，Release 標題：`v0.1.0 — Modular JSON Data and GitHub Pages`。

Release 內容（可貼至 GitHub）：

> First GitHub Pages-ready release of NYCU Research Resource Explorer. Splits the original standalone page into maintainable JSON datasets, CSS, and JavaScript. Preserves 170 resource entries, 33 platform groups, 22 teaching units, and seven-question 3+2+1 exploration. Includes integrity validation, maintenance documentation, and automated deployment. Resource access statuses are not verified in real time. This is a prototype pending institutional publication and licensing review.

## SEO／分享欄位（可選）

- Website title：`NYCU 研究資源探索｜從研究問題找到適合的資料庫`
- Meta description：`透過七道研究情境題，探索國立陽明交通大學圖書館研究資源，取得 3＋2＋1 平台推薦及研究微任務。`
- Social preview：建議後續提供經授權的 1280×640 社群分享圖，使用機構識別前先確認授權。

> Repo Description 與 Topics 是 GitHub About 欄位；Meta description 才屬網站 HTML，兩者並不相同。