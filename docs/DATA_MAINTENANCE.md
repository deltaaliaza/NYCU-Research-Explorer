# 資料更新 SOP

## 資料更新原則

**先修改資料主檔、再確認關聯、最後跑檢核和前端測試。** 資源 ID 與平台 ID 是跨檔關聯鍵；資源名稱及永久網址可修改，ID 非必要不可變更。

### A. 只修正某一資料庫的連結／簡介

1. 編輯 `data/databases.json`，搜尋該筆 `database_id` 或 `name`。
2. 修改 `permalink`、`short_description` 或其他公開欄位。
3. 若有人工驗證，更新 `status_date`、`status_note`，並於 `CHANGELOG.md` 記錄。
4. 執行 `python scripts/validate_data.py`、本機預覽並點開入口。

### B. 新增一筆資料庫

1. 在 `data/databases.json` 加入完整資料（**含 `"display": true` 或 `false`**），分配**不與既有資料衝突的新 ID**。
2. 在 `data/groups.json` 中，將這個 ID 加到需要的 `databaseIds`，必要時設為 `primaryDatabaseId`。
3. 如需將它設為某學院常見入口，調整 `data/units.json` 的 `baseGroups`（**填群組 ID，不是資料庫 ID**）。
4. 更新 `data/site.json` 的 `metadata.includedRecordCount`，檢核並人工試用。

### C. 新增教學單位或新的群組

- 單位新增在 `units.json`，`cluster` 須存在 `site.json.clusters`。
- 群組新增在 `groups.json`，`databaseIds` 皆須存在；填入 `needs`、`stages`、`materials`，以便推薦排序。
- 任何新增都要更新 `site.json.metadata` 的統計。

### D. 暫時停訂、終止訂閱或需要停止推薦（使用 `display`）

**建議優先停用顯示，保留主檔，不需刪除資料庫與群組關聯。**

1. 找到 `data/databases.json` 中對應的 `database_id`。
2. 將 `"display": true` 改成 **`"display": false`**（布林值，不要加引號）。
3. 依人工查證結果同步更新 `access_status`、`status_date`、`status_note` 等紀錄；`access_status` **不會自行觸發停用**。
4. 執行 `python scripts/validate_data.py` 與 `node --test tests/display.test.cjs`，本機測試後送交 GitHub；Actions 通過後將更新網站。
5. 恢復推薦時，只須改回 `"display": true`，不必重建 ID 或重新加入 `groups.json`。

例如（**僅作示意，原始 170 筆皆預設為 `true`**）：

```json
{
  "database_id": "NYCU-DB-063",
  "display": false,
  "name": "IEEE Xplore"
}
```

上面只展示關鍵欄位，**不要用此片段覆蓋整筆資料**，其他原始欄位需完整保留。

**前台規則**：同群有其他 `true` 仍可顯示群組，且微任務自動跳過已隱藏的主入口；群組全部都是 `false` 時，該群組會從推薦與總覽消失；若某個共通工具所有入口皆隱藏，工具卡片也會消失。資料檢核會警告全隱藏群組，並阻擋可見群組少於 6 個的部署。

**注意**：這是公開頁面的顯示開關，**不是機密資料的保護機制**。GitHub Pages 的原始 JSON 仍可直接下載。只有確定資料可以公開保存的資源，才適合使用這個方法；不得把內部帳密或授權資料放入 `databases.json`。如果真的要刪除主檔，仍應先移除所有群組及工具的引用，再更新 `metadata`。

### E. 調整題目

- 可直接改題目文字、說明及選項 `label`。
- 若修改 `value`、題目 `id` 或題數，需先檢查 `assets/app.js` 中 `styleId()`、`rank()` 與 `challenge()` 是否同步支援。
- 建議先保留 7 題；未完成完整測試前不建議刪除現有評分必要題。

## 目前推薦計分規則

| 條件 | 加分 |
| --- | ---: |
| 平台群組位於選定單位 `baseGroups` | +35 |
| 群組 `needs` 包含目前目的 | +35 |
| 群組 `stages` 包含研究階段 | +15 |
| 群組 `materials` 包含材料類型 | +12 |
| 群組分類符合探索風格加權類別 | +4 |
| `judgement` 與群組類別偏好相符 | +3 |

先依分數與 `number` 排序，選前 3 為核心、再選 2 個延伸群組及 1 個意外探索群組；實際選取多元性規則見 `assets/app.js` 的 `buildResult()`。

> **重要**：風格只由 `information`（具體／關聯）及 `process`（計畫／自由探索）組合得出。這是簡易操作偏好描述，不是 MBTI 或已驗證的心理測驗。`approach` 目前沒有進入排名或風格計分。所有結果皆不應被視為研究者能力評比。

## 上線前人工檢查清單

- [ ] JSON 可成功解析，`python scripts/validate_data.py` 無 ERROR；每筆資料均有布林值 `display`。
- [ ] 設為 `false` 的資料庫未出現在推薦、平台詳情、共通工具與研究微任務連結。
- [ ] 來源資料版權與公開授權經確認；不包含密碼、內部帳號或不適合公開的個資。
- [ ] 入口 URL 由負責人以瀏覽器抽樣檢查，確認導向正確 Primo 記錄。
- [ ] 正確區分「未查證」、「可連結」、「具有訂閱／授權」三種概念。
- [ ] 至少選 1 個理工、1 個人社、1 個醫學單位完成完整問卷。
- [ ] 下載、複製、重新開始、手機版及直接瀏覽正常。
- [ ] 已更新 `CHANGELOG.md`、資料筆數與最後查證資訊。

## 定期維護建議

- 每月：優先檢視停訂、更新或申請方式變動的高風險資料庫。
- 每學期：查核學院與系所清單、群組對應與推薦品質。
- 每年：全面檢視各資料庫描述、使用限制及對外揭露方式。

`validate_data.py` **不會對外連線**，不代表網址與授權狀態已有效查核。