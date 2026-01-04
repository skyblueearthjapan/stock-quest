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

## 以下、追加のスクリーンショットを受け取り次第追記

（続きをお送りください）
