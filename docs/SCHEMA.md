# JSON 資料架構

- `data/databases.json`：資料庫主檔；`database_id` 是唯一 ID；`display` 必須是布林值。暫時停訂請將 `display` 設為 `false`，勿刪除資料。
- `data/groups.json`：平台群組與 `databaseIds`。
- `data/units.json`：教學單位與 `baseGroups`。
- `data/questions.json`：探索問卷。
- `data/site.json`：網站分類、研究風格與共通工具。

`display: false` 僅控制前端是否呈現，不是資料存取權限。GitHub Pages 的 JSON 仍為公開。
