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

## UsageLog シート（利用ログ）

**説明**: 閲覧/使用確定/添付閲覧/ログイン等。

**カラム構成**:

| カラム名 | 必須 | 説明 |
|---------|-----|------|
| log_id* | ◯ | 主キー（例: LOG-000001） |
| timestamp* | ◯ | 日時 |
| user_id* | ◯ | ユーザーID（Users参照） |
| action* | ◯ | 操作種別（view_detail/use_confirmed等） |
| inventory_id | | 在庫ID（Inventory参照） |
| attachment_id | | 添付ID（Attachments参照） |
| project_code | | 工番（LW25000等） |
| qty_delta | | 数量増減（使用時はマイナス） |
| points | | 付与XP（確定値、不変） |
| client | | クライアント（web等） |
| notes | | メモ |

**サンプルデータ**:
```
log_id: LOG-000001
timestamp: 2026-01-01 10:10
user_id: U-001
action: view_detail
inventory_id: INV-000001
qty_delta: 0
points: 0
client: web

log_id: LOG-000002
timestamp: 2026-01-01 10:12
user_id: U-001
action: use_confirmed
inventory_id: INV-000001
project_code: LW25000
qty_delta: -1
points: 3
client: web
notes: 設計で使用
```

---

## ChatThreads シート（チャット状態）

**説明**: 未完了/進行中の拾い上げ用。

**カラム構成**:

| カラム名 | 必須 | 説明 |
|---------|-----|------|
| inventory_id* | ◯ | 主キー（在庫1件＝スレッド1件） |
| thread_status* | ◯ | ステータス（Open/InProgress/Done/OnHold） |
| related_project | | 関連工番 |
| assigned_staff_user_id | | 担当在庫スタッフのuser_id |
| last_message_at | | 最終メッセージ日時 |
| last_message_by | | 最終メッセージ送信者 |
| unread_for_staff | | スタッフ未読数 |
| unread_for_requester | | 依頼者未読数 |
| notes | | メモ |

**サンプルデータ**:
```
inventory_id: INV-000001
thread_status: Open
related_project: LW25000
assigned_staff_user_id: U-002
last_message_at: 2026-01-01 10:15
last_message_by: U-001
unread_for_staff: 1
unread_for_requester: 0
notes: 移動依頼あり
```

---

## ChatMessages シート（チャット本文）

**説明**: 在庫詳細内で継続する会話。

**カラム構成**:

| カラム名 | 必須 | 説明 |
|---------|-----|------|
| message_id* | ◯ | 主キー（例: MSG-000001） |
| inventory_id* | ◯ | 在庫ID（Inventory参照） |
| created_at* | ◯ | 送信日時 |
| sender_user_id* | ◯ | 送信者user_id |
| sender_role* | ◯ | 送信者ロール（designer/stock_manager） |
| message_text* | ◯ | メッセージ本文 |
| attachment_fileId | | 添付ファイルのDrive fileId |
| attachment_name | | 添付ファイル名 |
| is_system | | システムメッセージフラグ（TRUE/FALSE） |
| notes | | メモ |

**サンプルデータ**:
```
message_id: MSG-000001
inventory_id: INV-000001
created_at: 2026-01-01 10:15
sender_user_id: U-001
sender_role: designer
message_text: LW25000で使用したいです。第2工場にある場合、本社へ移動お願いします。
is_system: FALSE

message_id: MSG-000002
inventory_id: INV-000001
created_at: 2026-01-01 10:20
sender_user_id: U-002
sender_role: stock_manager
message_text: 了解です。移動手配します。完了したら連絡します。
is_system: FALSE
```

---

## PointRules シート（ポイント付与）

**説明**: サイズ/レア度などのルール。アプリが参照して use_confirmed の points を計算。

**カラム構成**:

| カラム名 | 必須 | 説明 |
|---------|-----|------|
| rule_id* | ◯ | 主キー（例: PR-001） |
| size_class | | サイズ区分（小/中/大/特大） |
| rarity | | レア度（Bronze/Silver/Gold/Legendary） |
| mode* | ◯ | モード（use_confirm/view） |
| points* | ◯ | 付与ポイント |
| notes | | 説明メモ |
| updated_at | | 更新日時 |
| updated_by | | 更新者 |

**データ一覧**:

| rule_id | size_class | rarity | mode | points | notes |
|---------|-----------|--------|------|--------|-------|
| PR-001 | 小 | Bronze | use_confirm | 1 | 小サイズ：+1XP |
| PR-002 | 中 | Silver | use_confirm | 2 | 中サイズ：+2XP |
| PR-003 | 大 | Gold | use_confirm | 3 | 大サイズ：+3XP（強めに評価） |
| PR-004 | 特大 | Legendary | use_confirm | 5 | 特大：+5XP（在庫担当が指定するレア） |
| PR-005 | | | view | 0 | 閲覧はXP付与しない（努力指標としてログのみ） |

---

## BadgeRules シート（バッジ条件）

**説明**: 集計時に判定して付与。

**カラム構成**:

| カラム名 | 必須 | 説明 |
|---------|-----|------|
| badge_id* | ◯ | 主キー（例: B-001） |
| badge_name* | ◯ | バッジ名（称号） |
| condition_type* | ◯ | 条件種別 |
| threshold* | ◯ | 閾値 |
| （単位） | | 単位（回/セット） |
| period_scope | | 期間スコープ（ANY/MONTH/H1H2） |
| description | | 説明 |
| updated_at | | 更新日時 |
| updated_by | | 更新者 |

**データ一覧**:

| badge_id | badge_name | condition_type | threshold | 単位 | period_scope | description |
|----------|-----------|----------------|-----------|-----|--------------|-------------|
| B-001 | 冒険開始の証 | use_count | 1 | 回 | ANY | 初めて在庫を使用 |
| B-002 | 丁寧なる使い手 | use_size_count_small | 5 | 回 | MONTH | 小を5回使用（今月） |
| B-003 | 堅実なる設計者 | use_size_count_mid | 3 | 回 | MONTH | 中を3回使用（今月） |
| B-004 | 果敢なる挑戦者 | use_size_count_large | 1 | 回 | MONTH | 大を1回使用（今月） |
| B-005 | 伝説の一手 | use_size_count_legend | 1 | 回 | MONTH | 特大を1回使用（今月） |
| B-006 | 今月の功労者 | use_count | 3 | 回 | MONTH | 今月の使用3回 |
| B-007 | 万能型エンジニア | use_balanced_sml | 1 | セット | MONTH | 小/中/大を各1回以上（今月） |
| B-008 | 在庫活用の達人 | use_count | 10 | 回 | H1H2 | 半期で使用10回 |
| B-009 | 知識を尊ぶ者 | view_count | 30 | 回 | MONTH | 在庫詳細を30回閲覧（今月） |
| B-010 | 探究心の結晶 | view_count | 100 | 回 | H1H2 | 半期で閲覧100回 |

**condition_type 一覧**:
- `use_count`: 使用回数
- `use_size_count_small`: 小サイズ使用回数
- `use_size_count_mid`: 中サイズ使用回数
- `use_size_count_large`: 大サイズ使用回数
- `use_size_count_legend`: 特大サイズ使用回数
- `use_balanced_sml`: 小/中/大をバランスよく使用
- `view_count`: 閲覧回数

**period_scope 一覧**:
- `ANY`: 累計（期間制限なし）
- `MONTH`: 月単位
- `H1H2`: 半期単位

---

## Periods シート（半期/期間定義）

**説明**: 上半期/下半期を明示して集計する。

**カラム構成**:

| カラム名 | 必須 | 説明 |
|---------|-----|------|
| period_id* | ◯ | 主キー（例: P-2026-H1, P-2026-01） |
| label* | ◯ | 表示名（2026上半期、2026年01月等） |
| start_date* | ◯ | 開始日 |
| end_date* | ◯ | 終了日 |
| notes | | メモ |

**データ一覧（半期）**:

| period_id | label | start_date | end_date | notes |
|-----------|-------|------------|----------|-------|
| P-2026-H1 | 2026上半期 | 2026-04-01 | 2026-09-30 | 会社の半期（例:夏ボーナス評価） |
| P-2026-H2 | 2026下半期 | 2026-10-01 | 2027-03-31 | 会社の半期（例:冬ボーナス評価） |

**データ一覧（月別）**:

| period_id | label | start_date | end_date | notes |
|-----------|-------|------------|----------|-------|
| P-2026-01 | 2026年01月 | 2026-01-01 | 2026-01-31 | 月表示（若手キャラ用/ログ集計用） |
| P-2026-02 | 2026年02月 | 2026-02-01 | 2026-02-28 | 月表示（若手キャラ用/ログ集計用） |
| P-2026-03 | 2026年03月 | 2026-03-01 | 2026-03-31 | 月表示（若手キャラ用/ログ集計用） |
| P-2026-04 | 2026年04月 | 2026-04-01 | 2026-04-30 | 月表示（若手キャラ用/ログ集計用） |
| P-2026-05 | 2026年05月 | 2026-05-01 | 2026-05-31 | 月表示（若手キャラ用/ログ集計用） |
| P-2026-06 | 2026年06月 | 2026-06-01 | 2026-06-30 | 月表示（若手キャラ用/ログ集計用） |
| P-2026-07 | 2026年07月 | 2026-07-01 | 2026-07-31 | 月表示（若手キャラ用/ログ集計用） |
| P-2026-08 | 2026年08月 | 2026-08-01 | 2026-08-31 | 月表示（若手キャラ用/ログ集計用） |
| P-2026-09 | 2026年09月 | 2026-09-01 | 2026-09-30 | 月表示（若手キャラ用/ログ集計用） |
| P-2026-10 | 2026年10月 | 2026-10-01 | 2026-10-31 | 月表示（若手キャラ用/ログ集計用） |
| P-2026-11 | 2026年11月 | 2026-11-01 | 2026-11-30 | 月表示（若手キャラ用/ログ集計用） |
| P-2026-12 | 2026年12月 | 2026-12-01 | 2026-12-31 | 月表示（若手キャラ用/ログ集計用） |

---

## Import_Staging シート（既存Excel移行）

**説明**: 貼り付け専用。変換してDBへ登録。

**カラム構成**:

| カラム名 | 説明 |
|---------|------|
| source_sheet | 元シート名（例: 22.7へドグ） |
| source_no | 元番号 |
| part_name | 部品名 |
| category | カテゴリ |
| qty | 数量 |
| confirm_date | 確認日 |
| source_work_no | 工番 |
| location_text | 場所テキスト（例: 本社 棚A 2段3番） |
| image_link | 画像リンク（旧リンク） |
| pdf_link | PDFリンク |
| cad_link | CADリンク |
| notes | メモ |

**サンプルデータ**:
```
source_sheet: 22.7へドグ
source_no: 1
part_name: ドグ Aタイプ
category: ドグ
qty: 3
confirm_date: 2026-01-01
source_work_no: LW25000
location_text: 本社 棚A 2段3番
image_link: (旧リンク)
```

---

## Dashboard_User シート（個人集計の元）

**説明**: アプリで集計して書き戻す想定。

**カラム構成**:

| カラム名 | 説明 |
|---------|------|
| user_id | ユーザーID |
| display_name | 表示名 |
| period_id | 期間ID |
| views | 閲覧回数 |
| uses | 使用回数 |
| points | ポイント（XP） |
| level | レベル |
| last_activity | 最終活動日 |

**サンプルデータ**:
```
user_id: U-001
display_name: 山田太郎
period_id: P-2026-H1
views: 120
uses: 8
points: 32
level: 1
last_activity: 2026-06-30
```

---

## Dashboard_Ranking シート（ランキング元）

**説明**: points/views/uses の順位表。

**カラム構成**:

| カラム名 | 説明 |
|---------|------|
| period_id | 期間ID |
| rank_type | ランキング種別（points/views/uses） |
| rank | 順位 |
| user_id | ユーザーID |
| display_name | 表示名 |
| value | 値 |
| notes | メモ |

**サンプルデータ**:
```
period_id: P-2026-H1
rank_type: points
rank: 1
user_id: U-001
display_name: 山田太郎
value: 32

period_id: P-2026-H1
rank_type: views
rank: 1
user_id: U-001
display_name: 山田太郎
value: 120
```

---

## Dashboard_UsageItems シート（使用明細）

**説明**: 『何を使ったか』を即表示するための明細。

**カラム構成**:

| カラム名 | 説明 |
|---------|------|
| period_id | 期間ID |
| user_id | ユーザーID |
| timestamp | 使用日時 |
| inventory_id | 在庫ID |
| part_name | 部品名 |
| qty | 数量 |
| points | 付与ポイント |
| project_code | 工番 |
| location_text | 場所テキスト |

**サンプルデータ**:
```
period_id: P-2026-H1
user_id: U-001
timestamp: 2026-06-10 14:20
inventory_id: INV-000001
part_name: ドグ Aタイプ
qty: 1
points: 3
project_code: LW25000
location_text: 本社_棚A-2-3
```

---

## ViewLog シート（閲覧ログ：努力指標）

**説明**: 閲覧ログ。同一在庫の短時間連続閲覧は集計時に除外。

**カラム構成**:

| カラム名 | 必須 | 説明 |
|---------|-----|------|
| view_id* | ◯ | 主キー（例: V-0001） |
| timestamp* | ◯ | 閲覧日時 |
| user_id* | ◯ | ユーザーID |
| inventory_id* | ◯ | 在庫ID |
| period_id_cache | | 期間IDキャッシュ（集計高速化） |
| session_id | | セッションID |
| source_page | | 遷移元ページ（inventory_detail等） |
| device | | デバイス（pc/mobile等） |
| notes | | メモ |

**サンプルデータ**:
```
view_id: V-0001
timestamp: 2026-01-04 10:12
user_id: U-001
inventory_id: INV-00012
period_id_cache: P-2026-01
session_id: S-abc123
source_page: inventory_detail
device: pc
notes: 同一在庫の短時間連続閲覧は集計時に除外
```

---

## Goals シート（目標：共通/個人）

**説明**: 共通目標→個人目標へ段階移行できる。

**カラム構成**:

| カラム名 | 必須 | 説明 |
|---------|-----|------|
| goal_id* | ◯ | 主キー（例: G-2026-01-COMMON） |
| period_id* | ◯ | 期間ID（Periods参照） |
| goal_type* | ◯ | 目標タイプ（COMMON/PERSONAL） |
| user_id | | ユーザーID（PERSONAL時のみ） |
| target_level* | ◯ | 目標レベル |
| is_active* | ◯ | 有効フラグ（1/0） |
| notes | | メモ |
| created_at | | 作成日時 |
| created_by | | 作成者 |
| updated_at | | 更新日時 |
| updated_by | | 更新者 |

**サンプルデータ**:
```
goal_id: G-2026-01-COMMON
period_id: P-2026-01
goal_type: COMMON
target_level: 5
is_active: 1
notes: 導入期:全員共通
created_at: 2026-01-04 09:00
created_by: admin

goal_id: G-2026-H1-COMMON
period_id: P-2026-H1
goal_type: COMMON
target_level: 8
is_active: 1
notes: 半期の共通目標（例）

goal_id: G-2026-01-U001
period_id: P-2026-01
goal_type: PERSONAL
user_id: U-001
target_level: 6
is_active: 0
notes: 個別目標は必要になったらON
```

**優先順位ルール**:
1. PERSONAL（active）があればそれを採用
2. なければ COMMON（active）を採用
3. どちらもなければデフォルト（Configでfallback）

---

## Badges シート（称号バッジ：表示名と演出）

**説明**: 称号バッジの表示名と演出。

**カラム構成**:

| カラム名 | 必須 | 説明 |
|---------|-----|------|
| badge_id* | ◯ | 主キー（例: B-001） |
| badge_name* | ◯ | バッジ名（称号） |
| tier* | ◯ | ティア（Bronze/Silver/Gold/Legendary） |
| icon_key | | アイコンキー |
| short_copy | | 短いコピー |
| description | | 説明文 |
| is_active* | ◯ | 有効フラグ（1/0） |
| updated_at | | 更新日時 |
| updated_by | | 更新者 |

**データ一覧**:

| badge_id | badge_name | tier | icon_key | short_copy | description |
|----------|-----------|------|----------|------------|-------------|
| B-001 | 冒険開始の証 | Bronze | start | はじめの一歩 | 在庫を初めて使用した証。 |
| B-002 | 丁寧なる使い手 | Bronze | small_master | 積み重ねの達人 | 小サイズの在庫をコツコツ活用した。 |
| B-003 | 堅実なる設計者 | Silver | mid_solid | 堅実な判断 | 中サイズの在庫を活用できる判断力。 |
| B-004 | 果敢なる挑戦者 | Gold | large_bold | 金の一手 | 大サイズを使いこなす果敢さ。 |
| B-005 | 伝説の一手 | Legendary | legend | 別格の成果 | 特大在庫を活用し、在庫を前に進めた。 |
| B-006 | 今月の功労者 | Silver | month_worker | 今月も前進 | 今月の使用が一定回数に到達。 |
| B-007 | 万能型エンジニア | Gold | balanced | バランス型 | 小・中・大をバランス良く活用。 |
| B-008 | 在庫活用の達人 | Gold | master | 信頼の実績 | 今期の使用回数が一定に到達。 |
| B-009 | 知識を尊ぶ者 | Bronze | viewer | 見る力 | 在庫詳細を積極的に閲覧。 |
| B-010 | 探究心の結晶 | Silver | researcher | 研究熱心 | 閲覧を継続し、学びを積み上げた。 |

---

## Areas シート（拠点・エリア定義）

**説明**: 本社工場は2エリア、第二工場は1エリア想定。棚マップの上位階層。

**カラム構成**:

| カラム名 | 必須 | 説明 |
|---------|-----|------|
| site_id* | ◯ | 拠点ID（例: SITE-HQ） |
| site_name* | ◯ | 拠点名（例: 本社工場） |
| area_id* | ◯ | エリアID（例: AREA-HQ-1） |
| area_name* | ◯ | エリア名 |
| sort_order | | 表示順 |
| notes | | メモ |

**データ一覧**:

| site_id | site_name | area_id | area_name | sort_order | notes |
|---------|-----------|---------|-----------|------------|-------|
| SITE-HQ | 本社工場 | AREA-HQ-1 | 本社エリア1（手前） | 1 | 主要在庫エリア |
| SITE-HQ | 本社工場 | AREA-HQ-2 | 本社エリア2（奥） | 2 | 奥の在庫エリア |
| SITE-2F | 第二工場 | AREA-2F-1 | 第二工場エリア | 1 | 将来拡張用（在庫管理は主に本社） |

---

## Maps シート（棚マップ：上から/側面）

**説明**: エリア単位で『上から見た棚配置(トップ)』と『側面図(サイド)』画像を管理。

**カラム構成**:

| カラム名 | 必須 | 説明 |
|---------|-----|------|
| map_id* | ◯ | 主キー（例: MAP-HQ-1） |
| site_id* | ◯ | 拠点ID（Areas参照） |
| area_id* | ◯ | エリアID（Areas参照） |
| top_image_fileId | | 上面図のDrive fileId |
| side_image_fileId | | 側面図のDrive fileId |
| version | | バージョン |
| notes | | メモ |
| updated_at | | 更新日時 |
| updated_by | | 更新者 |

**データ一覧**:

| map_id | site_id | area_id | version | notes |
|--------|---------|---------|---------|-------|
| MAP-HQ-1 | SITE-HQ | AREA-HQ-1 | v1 | トップ/側面の画像をDriveに置いてfileIdを入力 |
| MAP-HQ-2 | SITE-HQ | AREA-HQ-2 | v1 | |
| MAP-2F-1 | SITE-2F | AREA-2F-1 | v1 | |

---

## Shelves シート（棚：トップビューのブロック）

**説明**: 棚ボタン（ブロック）1つ＝1行。押すと『棚の側面』or『棚の在庫一覧』へ。座標は%(0-100)。

**カラム構成**:

| カラム名 | 必須 | 説明 |
|---------|-----|------|
| shelf_id* | ◯ | 主キー（例: SH-HQ1-A） |
| map_id* | ◯ | マップID（Maps参照） |
| shelf_label* | ◯ | 棚ラベル（棚A等） |
| top_x% | | 上面図クリック範囲 X座標(%) |
| top_y% | | 上面図クリック範囲 Y座標(%) |
| top_w% | | 上面図クリック範囲 幅(%) |
| top_h% | | 上面図クリック範囲 高さ(%) |
| side_image_fileId | | 側面図のDrive fileId |
| shelf_photo_fileId | | 棚写真のDrive fileId |
| shelf_photo_note | | 棚写真メモ |
| max_levels | | 最大段数 |
| sort_order | | 表示順 |
| notes | | メモ |

**データ一覧**:

| shelf_id | map_id | shelf_label | max_levels | sort_order | notes |
|----------|--------|-------------|------------|------------|-------|
| SH-HQ1-A | MAP-HQ-1 | 棚A | 3 | 1 | 例：エリア1の棚A |
| SH-HQ2-A | MAP-HQ-2 | 棚A | 3 | 1 | 例：エリア2の棚A |
| SH-2F-A | MAP-2F-1 | 棚A | 2 | 1 | 例：第二工場の棚A |

---

## Bins シート（棚の区画：段/位置）

**説明**: 在庫が最終的に紐づく最小単位。側面図上のクリック領域（矩形）も%で管理。

**カラム構成**:

| カラム名 | 必須 | 説明 |
|---------|-----|------|
| bin_id* | ◯ | 主キー（例: BIN-HQ1-A-2-3） |
| shelf_id* | ◯ | 棚ID（Shelves参照） |
| level* | ◯ | 段（床/1段/2段...） |
| position* | ◯ | 位置（並び順） |
| label | | ラベル（例: 2段3番） |
| side_x% | | 側面図クリック範囲 X座標(%) |
| side_y% | | 側面図クリック範囲 Y座標(%) |
| side_w% | | 側面図クリック範囲 幅(%) |
| side_h% | | 側面図クリック範囲 高さ(%) |
| bin_photo_fileId | | 区画写真のDrive fileId |
| bin_photo_note | | 区画写真メモ |
| is_active | | 有効フラグ（TRUE/FALSE） |
| notes | | メモ |

**サンプルデータ**:
```
bin_id: BIN-HQ1-A-2-3
shelf_id: SH-HQ1-A
level: 2
position: 3
label: 2段3番
is_active: TRUE
notes: 例：棚Aの2段3番
```

---

## LevelRules シート（レベル設計）

**説明**: 経験値(XP)→レベルの変換ルール。若手向けRPG表示の基礎。

**カラム構成**:

| カラム名 | 必須 | 説明 |
|---------|-----|------|
| level* | ◯ | レベル |
| xp_required_total* | ◯ | 必要累計XP |
| title | | レベル名 |
| notes | | メモ |
| updated_at | | 更新日時 |
| updated_by | | 更新者 |

**データ一覧（3XPごとにLv+1）**:

| level | xp_required_total | title | notes |
|-------|-------------------|-------|-------|
| 1 | 0 | Lv1 | 3XPごとにLv+1（小=1/中=2/大=3/特大=5） |
| 2 | 3 | Lv2 | |
| 3 | 6 | Lv3 | |
| 4 | 9 | Lv4 | |
| 5 | 12 | Lv5 | |
| 6 | 15 | Lv6 | |
| 7 | 18 | Lv7 | |
| 8 | 21 | Lv8 | |
| 9 | 24 | Lv9 | |
| 10 | 27 | Lv10 | |
| 11 | 30 | Lv11 | |
| 12 | 33 | Lv12 | |
| 13 | 36 | Lv13 | |
| 14 | 39 | Lv14 | |
| 15 | 42 | Lv15 | |
| 16 | 45 | Lv16 | |
| 17 | 48 | Lv17 | |
| 18 | 51 | Lv18 | |
| 19 | 54 | Lv19 | |
| 20 | 57 | Lv20 | |
| 21 | 60 | Lv21 | |
| 22 | 63 | Lv22 | |
| 23 | 66 | Lv23 | |
| 24 | 69 | Lv24 | |
| 25 | 72 | Lv25 | |
| 26 | 75 | Lv26 | |
| 27 | 78 | Lv27 | |
| 28 | 81 | Lv28 | |
| 29 | 84 | Lv29 | |
| 30 | 87 | Lv30 | |

**計算ルール**: Lv = floor(XP / 3) + 1（最大Lv30）

---

## UserBadges シート（バッジ実績）

**説明**: 誰がどのバッジを獲得したかの実績。社内説明の根拠にもなる。

**カラム構成**:

| カラム名 | 必須 | 説明 |
|---------|-----|------|
| user_badge_id* | ◯ | 主キー（例: UB-000001） |
| user_id* | ◯ | ユーザーID |
| badge_id* | ◯ | バッジID（Badges参照） |
| period_id | | 期間ID（Periods参照） |
| granted_at* | ◯ | 付与日時 |
| source_metric | | 付与根拠の指標 |
| source_value | | 付与根拠の値 |
| notes | | メモ |

**サンプルデータ**:
```
user_badge_id: UB-000001
user_id: U-001
badge_id: B-001
granted_at: 2026-01-10 12:00
source_metric: first_use
source_value: 1
notes: 初使用
```

---

## CharacterProfiles シート（キャラクター設定）

**説明**: 若手向け"ゲーム画面"用。各設計者を主人公キャラとして表示。社長レポートには使わない。

**カラム構成**:

| カラム名 | 必須 | 説明 |
|---------|-----|------|
| user_id* | ◯ | 主キー（Users参照、1:1） |
| character_name* | ◯ | キャラクター名 |
| job_class | | 職業クラス |
| avatar_fileId | | アバター画像のDrive fileId |
| bio | | 自己紹介 |
| theme | | テーマ（DQ風等） |
| is_public_to_designers | | 他設計者に公開（TRUE/FALSE） |
| updated_at | | 更新日時 |
| updated_by | | 更新者 |

**サンプルデータ**:
```
user_id: U-001
character_name: 山田の勇者
job_class: 勇者
bio: 在庫を活用して設計効率を上げる。
theme: DQ風
is_public_to_designers: TRUE
updated_at: 2026-01-04 00:00
updated_by: admin

user_id: U-002
character_name: 在庫番人
job_class: 番人
bio: 在庫の守護者。迅速に移動・準備する。
theme: DQ風
is_public_to_designers: FALSE
updated_at: 2026-01-04 00:00
updated_by: admin
```

---

## UserStatsCache シート（集計キャッシュ）

**説明**: ユーザー×期間ごとの集計を高速表示するためのキャッシュ。ランキングやキャラ詳細画面で使用。

**カラム構成**:

| カラム名 | 必須 | 説明 |
|---------|-----|------|
| user_id* | ◯ | ユーザーID（Users参照） |
| period_id* | ◯ | 期間ID（Periods参照） |
| xp* | ◯ | 経験値（XP） |
| level* | ◯ | レベル |
| points | | ポイント（XPと同義、表示用） |
| uses | | 使用回数 |
| views | | 閲覧回数 |
| badges_count | | 獲得バッジ数 |
| last_updated_at | | 最終更新日時 |
| notes | | メモ |

**サンプルデータ**:
```
user_id: U-001
period_id: P-2026-01
xp: 15
level: 6
points: 15
uses: 5
views: 42
badges_count: 3
last_updated_at: 2026-01-04 12:00
notes: 2026年1月の集計キャッシュ

user_id: U-001
period_id: P-2026-H1
xp: 32
level: 11
points: 32
uses: 12
views: 120
badges_count: 5
last_updated_at: 2026-06-30 23:59
notes: 2026上半期の集計キャッシュ
```

**複合キー**: user_id + period_id

**更新タイミング**:
- 使用確定時にリアルタイム更新
- 閲覧ログ登録時に更新
- 日次バッチで全件再計算（整合性担保）

---

## Report_Official シート（社長向け公式レポート）

**説明**: 半期ごとの公式レポート用データ。印刷/PDF出力の元データ。

**カラム構成**:

| カラム名 | 必須 | 説明 |
|---------|-----|------|
| period_id* | ◯ | 期間ID（Periods参照） |
| metric* | ◯ | 指標名（use_count, view_count, xp_total等） |
| user_id | | ユーザーID（個人レポート時） |
| display_name | | 表示名 |
| value* | ◯ | 値 |
| unit | | 単位（回、XP等） |
| rank | | 順位（ランキング時） |
| notes | | メモ |

**サンプルデータ（全体サマリー）**:
```
period_id: P-2026-H1
metric: total_uses
value: 156
unit: 件
notes: 半期の全使用件数

period_id: P-2026-H1
metric: active_users
value: 12
unit: 人
notes: 使用実績がある人数

period_id: P-2026-H1
metric: total_views
value: 1240
unit: 回
notes: 半期の閲覧回数
```

**サンプルデータ（個人ランキング）**:
```
period_id: P-2026-H1
metric: use_count
user_id: U-001
display_name: 山田太郎
value: 15
unit: 回
rank: 1
notes: 使用回数TOP1

period_id: P-2026-H1
metric: use_count
user_id: U-003
display_name: 佐藤花子
value: 12
unit: 回
rank: 2
notes: 使用回数TOP2
```

**metric 一覧**:
- `total_uses`: 全体使用件数
- `active_users`: 活用人数
- `total_views`: 全体閲覧回数
- `use_count`: 個人使用回数
- `view_count`: 個人閲覧回数
- `xp_total`: 個人XP合計
- `size_small_count`: 小サイズ使用回数
- `size_mid_count`: 中サイズ使用回数
- `size_large_count`: 大サイズ使用回数
- `size_legend_count`: 特大サイズ使用回数

---

# ドキュメント完成

本ドキュメントは、在庫管理クエストWebアプリのデータベース（Googleスプレッドシート）の実際の構造を記録したものです。

**記録シート数**: 30シート

**セクション構成**:
1. システム設定（README, Config, Lookups）
2. マスタデータ（Inventory, Locations, Attachments, Users）
3. トランザクション（UsageLog, ChatThreads, ChatMessages）
4. ルール定義（PointRules, BadgeRules, LevelRules）
5. 期間管理（Periods, Goals）
6. ダッシュボード（Dashboard_User, Dashboard_Ranking, Dashboard_UsageItems）
7. ログ（ViewLog）
8. マップ関連（Areas, Maps, Shelves, Bins）
9. ゲーミフィケーション（Badges, UserBadges, CharacterProfiles）
10. キャッシュ・集計（UserStatsCache）
11. レポート（Report_Official）
12. インポート（Import_Staging）

**作成日**: 2026-01-04
