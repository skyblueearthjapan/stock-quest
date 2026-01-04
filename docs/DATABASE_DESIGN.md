# ② データ設計（スプレッドシート＝DB）全体構造

コーディングエージェントがそのままDB/API/画面実装に落とせることが目的。
シート（=テーブル）ごとに以下を揃えて渡す。

- 目的（どの機能を支えるか）
- 主キー（PK）
- 参照（FK）
- 入力者（誰が更新するか）
- 更新ルール（いつ更新され、何は変えないか）
- 重要列（ヘッダー）と意味
- 代表的なクエリ/使い方（実装の勘所）

対象は v5 テンプレート（在庫管理クエスト_DBテンプレート_v5_目標・閲覧ログ・特大対応.xlsx）の全シート。

---

## データの層（設計思想）

1. **マスタ（静的）**：ユーザー、在庫、場所、マップ、ルール、期間、選択肢
2. **トランザクション（履歴）**：使用ログ、閲覧ログ、チャット
3. **派生（集計キャッシュ）**：ユーザー×期間のXP/Lv/閲覧/使用/バッジ数
4. **レポート**：公式レポート出力結果、出力履歴
5. **運用補助**：インポート用ステージング、ダッシュボード用ビュー

**重要：履歴ログ（UsageLog/ViewLog/ChatMessages）は原則不変。**
マスタ（Inventoryのsize_class等）は後から変更可能。ただし **過去のログは書き換えない**。

---

## A. マスタ（静的）

### 1) Config

**目的**：アプリ全体の設定値（URL、DriveフォルダID、閾値など）
**PK**：key
**更新者**：管理者

**列**
- key：設定キー
- value：値
- 説明：人間用

**実装メモ**：Apps Script側で getConfig(key) を用意し、毎回参照。

---

### 2) Lookups（選択肢マスタ）

**目的**：入力UIのプルダウン/選択肢を一元管理
**更新者**：管理者 or 在庫担当（運用次第）

**列**
- カテゴリ / ステータス / 添付種別 / チャット状態 / 操作種別
- サイズ区分（小/中/大/特大）
- レア度（Bronze/Silver/Gold/Legendary）
- 段レベル（床/1段/2段/3段/4段/天板）

**実装メモ**：フォーム生成時にLookupsから候補を生成。カテゴリタブもここ由来にすると強い。

---

### 3) Users（ユーザー）

**目的**：ログイン（名前＋PIN）・権限・表示名・最終ログインなど
**PK**：user_id*
**更新者**：管理者（初期登録・異動・無効化）

**列（主要）**
- user_id*：一意ID（例 U-001）
- display_name*：表示名（検索・ログイン候補）
- role*：designer / stock_staff / admin
- team / email
- is_active*：有効フラグ
- total_xp_cache / level_cache：全期間ざっくり表示用（任意）
- last_login_at
- notes / updated_at / updated_by

**更新ルール**
- display_name変更は可能（ただしログイン候補に影響）
- PINはこのシートに"生で持たない"方針推奨（後述）

**実装メモ（重要）**
PINは別管理が安全です（例：UserAuthシート or ScriptProperties/Drive暗号化）。
もしシート管理するなら、pin_hash（SHA-256等）で保持。

---

### 4) CharacterProfiles（若手RPGキャラ）

**目的**：キャラ一覧/詳細のプロフィール（画像・肩書・世界観）
**PK**：user_id*（Usersと1:1）
**更新者**：管理者 or 本人（本人編集の可否は運用で）

**列**
- user_id*
- character_name*
- job_class
- avatar_fileId（Driveの画像ID）
- bio / theme
- is_public_to_designers（公開制御）
- updated_at / updated_by

---

### 5) Periods（期間マスタ）

**目的**：月表示（若手）＋上半期/下半期（査定）の共通キー
**PK**：period_id*
**更新者**：管理者

**列**
- period_id*（例 P-2026-01 / P-2026-H1）
- period_name*
- start_date* / end_date*
- notes

**実装メモ**
キャラ詳細の「◀▶」は、Periodsをソートして前後移動。
上半期/下半期の定義は会社ルールに合わせて固定。

---

### 6) Goals（目標：共通/個人）

**目的**：共通目標→個別目標へ段階移行できる
**PK**：goal_id*
**更新者**：在庫担当（運用管理者）

**列**
- goal_id*
- period_id*（Periods参照）
- goal_type*：COMMON / PERSONAL
- user_id：PERSONAL時のみUsers参照
- target_level*
- is_active*
- notes
- created_at/created_by/updated_at/updated_by

**優先順位（実装ルール）**
1. PERSONAL（active）があればそれを採用
2. なければ COMMON（active）を採用
3. どちらもなければデフォルト（Configでfallback）

---

### 7) PointRules（XP付与ルール）

**目的**：小中大特大のXPを一元化（将来変更に強い）
**PK**：rule_id*（列名はシート内）
**更新者**：管理者

**内容（v5確定）**
- 小=1 / 中=2 / 大=3 / 特大=5
- use_confirm 時のみ付与
- view は 0（閲覧は努力指標：ログのみ）

**実装メモ**：size_class→points をこのシートから読む。ハードコード禁止。

---

### 8) LevelRules（レベル換算）

**目的**：XP→Lvの変換（3XPごとにLv+1）
**更新者**：管理者

**列（概念）**
- level
- min_total_xp
- title
- note
- updated_at / updated_by

**実装メモ**：Lv計算は「min_total_xpが最大で<=xpの行」を引く。

---

### 9) Badges（バッジカタログ：称号名・演出）

**目的**：表示名を"喜ばしい称号"として持つ。UI演出と分離。
**PK**：badge_id*
**更新者**：管理者

**列**
- badge_id*
- badge_name*（称号表示名）
- tier*（Bronze/Silver/Gold/Legendary）
- icon_key（UI側のアイコン参照キー）
- short_copy / description
- is_active*
- updated_at / updated_by

---

### 10) BadgeRules（バッジ付与条件）

**目的**：条件の定義（use/view/サイズ/期間）
**PK**：実装上は badge_id 単位でも良い（複数条件ならrule_idが必要）
**更新者**：管理者

**列**
- badge_id*
- badge_name*
- condition_type*（例：use_count、view_count、use_size_count_small等）
- threshold*
- unit
- period_scope（MONTH / H1H2 / ANY）
- description
- updated_at / updated_by

**実装メモ**：
バッジ計算は「UserStatsCache更新時に同時評価」がおすすめ（重い処理を回避）。

---

## B. 在庫マスタ・添付・場所・マップ

### 11) Inventory（在庫マスタ：最重要）

**目的**：在庫一覧/詳細/サイズ/Driveフォルダ/主画像など
**PK**：inventory_id*
**更新者**：在庫担当

**列（v5）**
- inventory_id*
- part_name*
- category*
- qty*
- unit
- size_class（小/中/大/特大：在庫担当が設定）
- rarity（Bronze/Silver/Gold/Legendary：基本はsize_classに連動）
- status*
- confirm_date
- source_work_no
- location_id（Locations参照：任意）
- bin_id / shelf_id（Bins/Shelves参照：任意）
- site_id_cache / area_id_cache / location_text_cache（検索高速化）
- primary_image_fileId
- drive_folder_id（在庫フォルダ自動生成の紐付け）
- notes
- created_at/created_by/updated_at/updated_by

**更新ルール**
- size_class は後から変更可（運用で調整）
- ただし UsageLogに記録されたpointsは当時のまま固定（履歴の信頼性）

---

### 12) Attachments（添付）

**目的**：PDF/画像/CAD等の紐付け（詳細で即開き）
**PK**：attachment_id*
**FK**：inventory_id* → Inventory
**更新者**：在庫担当（アップロード）

**列**
- attachment_id*
- inventory_id*
- type*（Lookupsの添付種別）
- fileId*（Drive fileId）
- file_name
- mime_type
- size_kb
- uploaded_at
- uploaded_by
- notes

**実装メモ**：
- 画像はカルーセル表示（type=photo等）
- PDFはプレビュー→拡大
- CADはダウンロード/外部起動導線

---

### 13) Areas（工場・エリア）

**目的**：本社/第二、エリア1/2…をマスタ化
**PK**：複合だが実装上は area_id を一意推奨

**列**
- site_id* / site_name*
- area_id* / area_name*
- sort_order
- notes

---

### 14) Maps（エリア上面図・棚側面図の画像管理）

**目的**：エリアの上面図、棚の側面図の基盤
**PK**：map_id*
**FK**：site_id*、area_id*（Areas）
**更新者**：在庫担当（マップ編集モード）

**列**
- map_id*
- site_id*
- area_id*
- top_image_fileId（上面図）
- side_image_fileId（棚の側面図の基準画像：任意）
- version
- notes
- updated_at/updated_by

---

### 15) Shelves（棚：上面図のクリック範囲＋棚情報）

**目的**：上面図で棚をクリックできるようにする（座標登録）
**PK**：shelf_id*
**FK**：map_id* → Maps
**更新者**：在庫担当（編集モード）

**列（概念）**
- shelf_id*
- map_id*
- shelf_label*（棚Aなど）
- top_x%/top_y%/top_w%/top_h%（上面図のクリック範囲：矩形）
- shelf_photo_fileId（棚の現場写真 or 側面写真）
- shelf_photo_note
- max_levels（段数：床〜天板なら6）
- sort_order
- notes

**実装メモ**：上面図クリック → shelf_id確定 → Shelvesへ遷移。

---

### 16) Bins（段：側面図のクリック範囲＋段写真）

**目的**：棚側面図で段をクリック→段内在庫一覧へ
**PK**：bin_id*
**FK**：shelf_id* → Shelves
**更新者**：在庫担当

**列**
- bin_id*
- shelf_id*
- level*（床/1段…天板：Lookupsの段レベル）
- position*（並び順）
- label
- side_x%/side_y%/side_w%/side_h%（側面図のクリック範囲：矩形）
- bin_photo_fileId（段の現場写真＝最終確認）
- bin_photo_note
- is_active
- notes

---

### 17) Locations（在庫の位置：補助）

**目的**：棚番号等の文字情報、ピン表示、旧Excel移行にも使える
**PK**：location_id*
**更新者**：在庫担当

**列**
- location_id*
- site* / building / area
- shelf_no
- level
- position
- map_image_fileId
- pin_x / pin_y（ピン座標）
- notes
- updated_at/updated_by

**運用メモ**：
今回のメインは Shelves/Bins/Maps でビジュアル化。Locationsは「文字補助」として残す位置付け。

---

## C. トランザクション（履歴）

### 18) UsageLog（使用ログ：最重要）

**目的**：使用確定、数量増減、XP付与、社長レポート根拠
**PK**：log_id*
**FK**：user_id* → Users、inventory_id → Inventory
**更新者**：設計者（使用確定時に自動追加）

**列**
- log_id*
- timestamp*
- user_id*
- action*（Lookupsの操作種別：use_confirm等）
- inventory_id
- attachment_id（任意）
- project_code（工番：LW25000等）
- qty_delta（使用ならマイナス）
- points（その時点で確定したXP：不変）
- client（PC/モバイル等任意）
- notes

**更新ルール**
- 基本は追記のみ（修正は原則禁止）
- 取消が必要なら action=use_cancel 等で逆仕訳ログを追加

---

### 19) ViewLog（閲覧ログ）

**目的**：閲覧回数（努力指標）・バッジ根拠
**PK**：view_id*
**更新者**：設計者が詳細閲覧した時に自動追加

**列**
- view_id*
- timestamp*
- user_id*
- inventory_id*
- period_id_cache（集計高速化）
- session_id
- source_page
- device
- notes

**集計ルール（不正/ブレ対策）**
- 同一ユーザー×同一在庫の連続閲覧は、集計時に除外（例：5分以内は1回扱い）

---

### 20) ChatThreads（在庫詳細のスレッド状態）

**目的**：在庫ごとに会話を"継続"させる枠
**PK**：inventory_id*（在庫1件＝スレッド1件でOK）
**更新者**：システム（メッセージ投稿時に更新）

**列**
- inventory_id*
- thread_status*（Lookups：チャット状態）
- related_project（工番など）
- assigned_staff_user_id
- last_message_at
- last_message_by
- unread_for_staff
- unread_for_requester
- notes

---

### 21) ChatMessages（チャット本文）

**目的**：在庫担当と設計者のやり取り履歴（残る・続く）
**PK**：message_id*
**FK**：inventory_id* → Inventory、sender_user_id* → Users
**更新者**：設計者/在庫担当（投稿）

**列**
- message_id*
- inventory_id*
- created_at*
- sender_user_id*
- sender_role*
- message_text*
- attachment_fileId / attachment_name（任意）
- is_system（システム通知）
- notes

---

## D. 派生（集計・キャッシュ）

### 22) UserStatsCache（ユーザー×期間 集計）

**目的**：キャラ一覧/詳細を高速表示、ランキングの土台
**PK**：(user_id*, period_id*)
**更新者**：システム（定期/トリガーで再計算）

**列**
- user_id*
- period_id*
- xp*（points合計）
- level*
- points（xpと同義でもOK：将来用）
- uses
- views
- badges_count
- last_updated_at
- notes

**計算根拠**
- uses/xp：UsageLogから期間内集計
- views：ViewLogから期間内集計（重複除外）
- level：LevelRulesから換算
- badges_count：UserBadgesの期間内（または累計方針）に合わせる

---

### 23) UserBadges（ユーザーのバッジ獲得）

**目的**：いつ何を獲得したか（表示・証拠）
**PK**：user_badge_id*（推奨）
**FK**：user_id、badge_id、period_id
**更新者**：システム（集計時に付与）

**列（概念）**
- user_id*
- badge_id*
- period_id*（付与対象期間）
- earned_at*
- rule_snapshot（任意：付与時の閾値記録）
- notes など

v5にはシートが存在するので、この方針で実装すればOK。

---

## E. レポート（社長向け）

### 24) ReportRuns（レポート出力履歴）

**目的**：印刷/PDF出力を「いつ誰が作ったか」残す
**PK**：report_run_id*
**更新者**：在庫担当（出力ボタン）→システム記録

**列**
- report_run_id*
- period_id*
- generated_at*
- generated_by*
- pdf_fileId
- summary
- notes

---

### 25) Report_Official（公式レポートの中身：構造化）

**目的**：全体/個人の数値・ランキング・根拠を格納（印刷に流す）
**PK**：実装上は (period_id, metric, user_id) 等
**更新者**：システム（レポート生成時）

**列**
- period_id*
- metric
- user_id
- display_name
- value
- unit
- rank
- notes

**実装メモ**：
PDFテンプレート側で metric をキーにセクションを作ると安定（例：USES_TOTAL / VIEWS_TOTAL / TOP_USERS / USER_ITEM_LIST 等）。

---

## F. 運用補助・ビュー

### 26) Import_Staging（Excel移行用ステージング）

**目的**：旧Excelを安全に取り込み、Inventory/Attachments/Locationsへ変換
**更新者**：在庫担当（貼り付け）

**列**
- source_sheet / source_no
- part_name / category / qty
- confirm_date / status
- location_text
- image_link / pdf_link / cad_link
- notes

**実装メモ**：
インポート処理は「重複検出（part_name+category等）」と「Driveリンク→fileId変換」を用意。

---

### 27) Dashboard_*（表示用ビュー）

- **Dashboard_User**：ユーザー×期間の一覧表示
- **Dashboard_Ranking**：ランキング表示
- **Dashboard_UsageItems**：使用アイテム一覧（写真付きの元）

**方針**：
これらは派生ビューとして扱い、実データは UserStatsCache / UsageLog / Inventory から生成可能。
（最初はシートに出力してもOK、将来は画面で直接集計でもOK）

---

## G. README（説明）

**目的**：運用手順、注意点、更新ルール（人間向け）
実装とは別だが、引き継ぎに効く。

---

## 実装に必要な "必須ルール"（エージェント向け）

コーディングエージェントに渡すとき、ここを明記すると事故が減る。

### 1) IDルール

- U-xxx / INV-xxxxx / A-xxxxx / V-xxxxx / L-xxxxx ... などプレフィックスで自動採番
- スプレッドシート上で一意性チェック（重複禁止）

### 2) 書き換え禁止の範囲

- UsageLog / ViewLog / ChatMessages は追記のみ
- 修正が必要なら逆仕訳ログ（cancel/adjust）を追加

### 3) size_class と points の扱い

- Inventoryの size_class は在庫担当が変更可
- UsageLogの points は確定値（その時点のルールで固定）

### 4) 期間計算

- 期間は必ず Periods を参照（ハードコード禁止）
- 月表示（若手）と半期（査定）を同一の period_id で切替

### 5) 閲覧の重複除外

- ViewLogは貯めて、集計時に除外（例：同一user+inventoryの5分以内は1回）

---

## コーディングエージェントに渡す形式（そのまま貼れる）

最後に、エージェントに渡すときはこの順番が理解されやすい。

1. 「データ層の説明（マスタ/ログ/キャッシュ/レポート）」
2. 各シートの定義（上記A→Gの順）
3. 禁止事項（ログ不変、ポイント確定、期間はPeriods）
4. 代表クエリ（例：キャラ詳細＝UserStatsCache+UsageItems、在庫詳細＝Inventory+Attachments+Map+Chat）
