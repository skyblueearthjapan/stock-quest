# 実際のスプレッドシートDB構造（スクリーンショットより）

このドキュメントは実際のスプレッドシートDBテンプレートの構造を記録したものです。
設計・実装時に参照してください。

---

## シート一覧（全タブ）

確認されたシート（タブ）：

1. README
2. Config
3. Lookups
4. Inventory
5. Locations
6. Attachments
7. Users
8. UsageLog
9. ChatThreads
10. ChatMessages
11. PointRules
12. BadgeRules
13. Periods
14. Import_Staging
15. Dashboard_User
16. Dashboard_Ranking
17. Dashboard_UsageItems
18. ViewLog
19. Goals
20. Badges
21. Areas
22. Maps
23. Shelves
24. Bins
25. LevelRules
26. UserBadges
27. CharacterProfiles
28. UserStatsCache
29. Report_Official
30. ReportRuns

---

## README シート

**タイトル**: 在庫管理クエスト：スプレッドシートDB（テンプレート）

**説明**: WebアプリのデータベースとしてのExcelテンプレート。GAS/スプレッドシートへそのまま移行可能。

**運用ポイント**:
- このブックは『Excel→Googleスプレッドシートにインポート』して運用する前提で作っています。
- 主キーは inventory_id（不変）。部品名変更や同名部品があっても追跡できます。
- 使用確定：設計者が押したら即確定（承認なし）。ポイントは use_confirmed のみに付与。
- 在庫詳細チャット：inventory_idごとのスレッドとして永続保存（翌日も続きができます）。
- 半期集計：上半期/下半期の期間は Periods シートで定義（会社の期に合わせて変更）。
- 既存Excel移行：Import_Stagingに貼り付け→アプリでInventory/Locations/Attachmentsへ変換登録を想定。
- 現場写真：Shelves.shelf_photo_fileId（棚全体）/ Bins.bin_photo_fileId（区画）にDriveのfileIdを入れると、在庫詳細で『現場写真』として表示できます。

**ブック構成**: Inventory / Locations / Attachments / Users / UsageLog / ChatThreads / ChatMessages / PointRules / BadgeRules / Periods / Import_Staging / Dashboards

**棚マップ階層**: 拠点(site)→エリア(area)→棚(shelf)→区画(bin) の4階層で管理。Bins（段/位置）に在庫が紐づく。

**評価/RPG関連**: LevelRules（レベル換算）、UserBadges（獲得実績）、CharacterProfiles（キャラ設定）、UserStatsCache（集計キャッシュ）、Report_Official/ReportRuns（社長向け公式レポート）を追加。

---

## Config シート（アプリ設定）

**説明**: 基本はここだけ編集。Drive連携や閲覧重複抑制など。

| key | value | 説明 |
|-----|-------|------|
| drive_root_folder_id | （空欄） | 共有フォルダID（在庫管理クエスト/） |
| drive_create_category_folders | TRUE | カテゴリフォルダ自動生成（TRUE/FALSE） |
| drive_subfolders | images,pdf,cad,others | 部品フォルダ内のサブフォルダ |
| view_dedupe_minutes | 30 | 閲覧重複を抑制する分数 |
| default_timezone | Asia/Tokyo | タイムゾーン |
| period_mode | SEMIANNUAL | SEMIANNUAL/MONTHLY |
| semiannual_first_start | 2026-04-01 | 上半期の開始日（要調整） |

---

## Lookups シート（選択肢マスタ）

**説明**: プルダウン候補。増やすだけでOK。

| カテゴリ | ステータス | 添付種別 | チャット状態 | 操作種別 | サイズ区分 | レア度 | 段レベル |
|---------|-----------|---------|-------------|---------|-----------|--------|---------|
| ドグ | IN_STOCK | image | Open | view_detail | 小 | Bronze | 床 |
| ストッパー | RESERVED | pdf | InProgress | open_attachment | 中 | Silver | 1段 |
| 面板 | USED_OUT | cad | Done | use_confirmed | 大 | Gold | 2段 |
| 平歯車 | DISPOSED | others | OnHold | chat_message | 特大 | Legendary | 3段 |
| 場内製作品(大) | MISSING | location_photo | | login | | | 4段 |
| 場内製作品(細) | | | | location_view | | | 天板 |

---

## Inventory シート（在庫マスタ）

**説明**: 一覧・検索・詳細の中心。

**カラム構成**:

| カラム名 | 必須 | 説明 |
|---------|-----|------|
| inventory_id* | ◯ | 主キー（例: INV-000001） |
| part_name* | ◯ | 部品名 |
| category* | ◯ | カテゴリ（Lookupsより） |
| qty* | ◯ | 数量 |
| unit | | 単位（pcs等） |
| size_class | | サイズ区分（小/中/大/特大） |
| rarity | | レア度（Bronze/Silver/Gold/Legendary） |
| status* | ◯ | ステータス（IN_STOCK等） |
| confirm_date | | 確認日 |
| source_work_no | | 工番（LW25000等） |
| location_id | | Locations参照 |
| bin_id | | Bins参照 |
| shelf_id | | Shelves参照 |
| site_id_cache | | 拠点IDキャッシュ |
| area_id_cache | | エリアIDキャッシュ |
| location_text_cache | | 場所テキストキャッシュ（例: 本社_棚A-2-3） |
| primary_image_fileId | | 主画像のDrive fileId |
| drive_folder_id | | 在庫フォルダのDrive ID |
| notes | | メモ |
| created_at | | 作成日時 |
| created_by | | 作成者 |
| updated_at | | 更新日時 |
| updated_by | | 更新者 |

**サンプルデータ**:
```
inventory_id: INV-000001
part_name: ドグ Aタイプ
category: ドグ
qty: 3
unit: pcs
size_class: 中
status: IN_STOCK
confirm_date: 2026-01-01
source_work_no: LW25000
location_id: LOC-001
location_text_cache: 本社_棚A-2-3
notes: 試作で余った。面取り済み。
created_at: 2026-01-01 10:00
created_by: admin
```

---

## Locations シート（置き場マスタ）

**説明**: 工場/棚/マップ画像/座標。

**カラム構成**:

| カラム名 | 必須 | 説明 |
|---------|-----|------|
| location_id* | ◯ | 主キー（例: LOC-001） |
| site* | ◯ | 拠点（本社等） |
| building | | 建屋（第1工場等） |
| area | | エリア（棚A等） |
| shelf_no | | 棚番号 |
| level | | 段 |
| position | | 位置 |
| map_image_fileId | | マップ画像のDrive fileId |
| pin_x | | ピンX座標 |
| pin_y | | ピンY座標 |
| notes | | メモ（例: 本社 倉庫 棚A 2段 3番） |
| updated_at | | 更新日時 |
| updated_by | | 更新者 |

**サンプルデータ**:
```
location_id: LOC-001
site: 本社
building: 第1工場
area: 棚A
shelf_no: A
level: 2
position: 3
notes: 例:本社 倉庫 棚A 2段 3番
updated_at: 2026-01-01 10:00
updated_by: admin
```

---

## Attachments シート（添付ファイル）

**説明**: 画像/PDF/CAD等。Drive fileIdで紐付け。

**カラム構成**:

| カラム名 | 必須 | 説明 |
|---------|-----|------|
| attachment_id* | ◯ | 主キー（例: ATT-000001） |
| inventory_id* | ◯ | 在庫ID（Inventory参照） |
| type* | ◯ | 添付種別（image/pdf/cad/others） |
| fileId* | ◯ | Drive fileId |
| file_name | | ファイル名 |
| mime_type | | MIMEタイプ |
| size_kb | | ファイルサイズ(KB) |
| uploaded_at | | アップロード日時 |
| uploaded_by | | アップロード者 |
| notes | | メモ |

**サンプルデータ**:
```
attachment_id: ATT-000001
inventory_id: INV-000001
type: pdf
file_name: ドグA図面.pdf
mime_type: application/pdf
uploaded_at: 2026-01-01 10:05
uploaded_by: admin
```

---

## Users シート（ユーザーマスタ）

**説明**: 設計者/在庫担当/管理者。

**カラム構成**:

| カラム名 | 必須 | 説明 |
|---------|-----|------|
| user_id* | ◯ | 主キー（例: U-001） |
| display_name* | ◯ | 表示名 |
| role* | ◯ | ロール（designer/stock_manager/admin） |
| team | | チーム（機械設計/資材等） |
| email | | メールアドレス |
| is_active* | ◯ | 有効フラグ（TRUE/FALSE） |
| total_xp_cache | | 全期間XPキャッシュ |
| level_cache | | レベルキャッシュ |
| last_login_at | | 最終ログイン日時 |
| notes | | メモ |
| updated_at | | 更新日時 |
| updated_by | | 更新者 |

**サンプルデータ**:
```
user_id: U-001
display_name: 山田太郎
role: designer
team: 機械設計
email: taro@example.com
is_active: TRUE
total_xp_cache: 0
level_cache: 1
updated_at: 2026-01-01 09:00
updated_by: admin

user_id: U-002
display_name: 在庫担当A
role: stock_manager
team: 資材
email: stock@example.com
is_active: TRUE
total_xp_cache: 0
level_cache: 1
updated_at: 2026-01-01 09:00
updated_by: admin
```

---

## 以下、追加のスクリーンショットを受け取り次第追記

（続きをお送りください）
