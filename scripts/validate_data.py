#!/usr/bin/env python3
"""Validate JSON syntax and all references for the static research resource site.
Run at repository root: python scripts/validate_data.py
No external dependencies or network requests.
"""
from __future__ import annotations
from pathlib import Path
from collections import Counter
from datetime import date
from urllib.parse import urlparse
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
ERRORS: list[str] = []
WARNINGS: list[str] = []


def err(msg: str) -> None:
    ERRORS.append(msg)


def warn(msg: str) -> None:
    WARNINGS.append(msg)


def load(name: str):
    path = DATA / name
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (ValueError, OSError) as e:
        err(f"{path.relative_to(ROOT)} 無法讀取或不是有效 JSON：{e}")
        return None


def unique(items: list, idkey: str, label: str) -> set[str]:
    vals = [x.get(idkey) for x in items if isinstance(x, dict)]
    duplicates = [v for v, cnt in Counter(vals).items() if cnt > 1]
    if duplicates:
        err(f"{label} 識別碼重複：{duplicates}")
    if any(not isinstance(v, str) or not v.strip() for v in vals):
        err(f"{label} 有空白或非法識別碼")
    return set(vals)


def verify():
    dbs = load('databases.json')
    groups = load('groups.json')
    units = load('units.json')
    questions = load('questions.json')
    site = load('site.json')
    if any(x is None for x in (dbs, groups, units, questions, site)):
        return
    if not all(isinstance(x, list) for x in (dbs, groups, units, questions)) or not isinstance(site, dict):
        err('根目錄型別錯誤：四種集合必須是陣列，site 必須是物件')
        return
    for key in ('clusters', 'commonTools', 'styles', 'metadata'):
        if key not in site:
            err(f'site.json 缺少 {key}')
    if ERRORS: return
    if not isinstance(site['clusters'], list) or not isinstance(site['commonTools'], list) or not isinstance(site['styles'], dict) or not isinstance(site['metadata'], dict):
        err('site.json 欄位型別錯誤')
        return

    db_ids = unique(dbs, 'database_id', '資料庫')
    visible_db_ids = {d['database_id'] for d in dbs if isinstance(d, dict)
                      and isinstance(d.get('database_id'), str) and d.get('display') is True}
    group_ids = unique(groups, 'id', '平台群組')
    unique(units, 'id', '教學單位')
    unique(questions, 'id', '問卷題目')
    unique(site['commonTools'], 'id', '共通工具')
    clusters = set(site['clusters'])
    categories = set()
    for d in dbs:
        if not isinstance(d, dict): err('databases 含非物件記錄'); continue
        label = d.get('database_id', 'UNKNOWN')
        # Require an explicit boolean. Values such as "false", 0, null, or an absent
        # property must not silently change the published catalogue.
        if not isinstance(d.get('display'), bool):
            err(f'{label}：display 必須明確設定為 JSON 布林值 true 或 false')
        for key in ('name', 'permalink', 'resource_type'):
            if not isinstance(d.get(key), str) or not d[key].strip():
                err(f'{label}：{key} 必須是非空字串')
        url = d.get('permalink')
        if isinstance(url, str) and url:
            parsed = urlparse(url)
            if parsed.scheme != 'https' or not parsed.netloc:
                err(f'{label}：permalink 必須是 HTTPS 網址')
            if parsed.netloc != 'nycu.primo.exlibrisgroup.com':
                warn(f'{label}：連結不是既有 NYCU Primo 主機，請人工查驗')
        if d.get('access_status') == '正常／未註記':
            # imported status; not a live access check
            pass
    visible_group_ids = set()
    for g in groups:
        if not isinstance(g, dict): err('groups 含非物件記錄'); continue
        gid = g.get('id', 'UNKNOWN')
        categories.add(g.get('category'))
        ids = g.get('databaseIds', [])
        if not isinstance(ids, list) or not ids:
            err(f'群組 {gid}：databaseIds 應是非空陣列'); continue
        missing = set(ids) - db_ids
        if missing: err(f'群組 {gid}：找不到資料庫 {sorted(missing)}')
        if set(ids) & visible_db_ids:
            visible_group_ids.add(gid)
        else:
            warn(f'群組 {gid}：全部資料庫 display=false，前台將隱藏整個群組')
        primary = g.get('primaryDatabaseId')
        if primary in db_ids and primary not in visible_db_ids and set(ids) & visible_db_ids:
            warn(f'群組 {gid}：primaryDatabaseId 已隱藏，前端將自動改用同群第一筆 display=true 資源')
        if primary not in ids: err(f'群組 {gid}：primaryDatabaseId 不在 databaseIds')
        if len(ids) != len(set(ids)): warn(f'群組 {gid}：資料庫 ID 重複')
        for key in ('needs', 'stages', 'materials', 'keywords'):
            if not isinstance(g.get(key), list): err(f'群組 {gid}：{key} 應為陣列')
    for u in units:
        if not isinstance(u, dict): err('units 含非物件記錄'); continue
        uid = u.get('id', 'UNKNOWN')
        if u.get('cluster') not in clusters: err(f'單位 {uid}：cluster 不在 site.clusters')
        bs = u.get('baseGroups', [])
        if not isinstance(bs, list) or not bs: err(f'單位 {uid}：baseGroups 應是非空陣列'); continue
        missing = set(bs) - group_ids
        if missing: err(f'單位 {uid}：找不到平台群組 {sorted(missing)}')
    for t in site['commonTools']:
        if not isinstance(t, dict): err('commonTools 含非物件記錄'); continue
        ids = t.get('databaseIds', [])
        if not isinstance(ids, list): err(f'工具 {t.get("id")}：databaseIds 應是陣列'); continue
        missing = set(ids) - db_ids
        if missing: err(f'工具 {t.get("id")}：找不到資料庫 {sorted(missing)}')
    for q in questions:
        if not isinstance(q, dict): err('questions 含非物件記錄'); continue
        qid = q.get('id', 'UNKNOWN')
        opts = q.get('options', [])
        if not isinstance(opts, list) or not opts: err(f'題目 {qid}：options 應是非空陣列'); continue
        values = [o.get('value') for o in opts if isinstance(o, dict)]
        if len(values) != len(set(values)): err(f'題目 {qid}：選項 value 重複')
    # The current recommendation algorithm depends on these exact IDs/values.
    needed = {'need', 'stage', 'material', 'information', 'judgement', 'process'}
    by_qid = {q.get('id'): q for q in questions if isinstance(q, dict)}
    if needed - set(by_qid): err(f'演算法必要題目遺失：{needed - set(by_qid)}')
    expected = {
        'information': {'concrete', 'connections'},
        'process': {'plan', 'wander'},
        'judgement': {'method', 'impact'}
    }
    for qid, must in expected.items():
        if qid in by_qid:
            found = {o.get('value') for o in by_qid[qid].get('options', []) if isinstance(o, dict)}
            if not must <= found: err(f'{qid}：必要選項 value 已被移除，會影響推薦風格或加權')
    if len(groups) < 6: err('群組數量小於六個，無法產生 3＋2＋1 推薦')
    if len(visible_group_ids) < 6:
        err(f'目前只有 {len(visible_group_ids)} 個可顯示的群組，無法產生 3＋2＋1 推薦；請至少保留六個')
    for name, style in site['styles'].items():
        extra = set(style.get('boostCategories', [])) - categories
        if extra: err(f'探索風格 {name}：未知分類 {sorted(extra)}')
    for key, n in (('includedRecordCount', len(dbs)),('platformGroupCount',len(groups)),('teachingUnitCount',len(units))):
        old = site['metadata'].get(key)
        if old != n: warn(f'site.metadata.{key} = {old}，目前實際是 {n}，請更新統計')
    if len(dbs) < site['metadata'].get('sourceRecordCount', 0):
        warn('來源紀錄數大於納入數，這可能是有意篩選；請勿將 sourceRecordCount 當作網站有效筆數')
    if len([d for d in dbs if not (d.get('short_description') or d.get('description_zh'))]) > 0:
        warn('部分資料庫沒有說明文字；維護時可逐筆補充，但非上線阻擋項目')

verify()
print('資料檢核結果：')
for line in ERRORS: print('ERROR:', line)
for line in WARNINGS: print('WARN :', line)
if ERRORS:
    print(f'FAILED：{len(ERRORS)} 個錯誤，{len(WARNINGS)} 個提醒')
    sys.exit(1)
print(f'PASS：0 個錯誤，{len(WARNINGS)} 個提醒（未進行網站連線或訂閱狀態確認）')