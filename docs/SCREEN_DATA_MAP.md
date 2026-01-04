# 付録：画面→データ参照マップ（実装指示用）

本ドキュメントは、各画面がどのシートを読み書きするかを明示したものです。
実装時にこのマップを参照することで、迷うことなくコーディングを進めることができます。

---

## 1) ログイン画面

**読む**
- Users（display_name, is_active, role）
- （推奨）UserAuth（pin_hash）※別管理なら

**書く**
- Users.last_login_at（任意）
- AuditLog（任意）

---

## 2) 在庫カテゴリタブ＋在庫一覧

**読む**
- Lookups.カテゴリ（タブ生成）
- Inventory（一覧表示）
- Areas / Shelves / Bins（位置表示が必要なら）

**書く**
- （なし）

---

## 3) 在庫詳細ページ

### A 在庫情報

**読む**
- Inventory

**書く**
- （在庫担当のみ）Inventory（編集）

### B 置き場カード（上面/側面/現場写真）

**読む**
- Areas / Maps / Shelves / Bins
- Inventory（shelf_id/bin_id or location系）

**書く**
- （なし）

### C 図面・写真・CAD

**読む**
- Attachments（inventory_id）
- Inventory.primary_image_fileId

**書く**
- Attachments（アップロード時）
- Inventory.primary_image_fileId（主画像変更時）

### D チャット

**読む**
- ChatThreads（inventory_id）
- ChatMessages（inventory_id）

**書く**
- ChatMessages（投稿）
- ChatThreads（last_message更新、ステータス更新）

### 使用確定ボタン

**読む**
- Inventory（現在qty、size_class）
- PointRules（size→points）

**書く**
- UsageLog（追記）
- Inventory.qty（減算）
- UserStatsCache（該当periodのみ再計算 or 後でバッチ）

---

## 4) 棚マップ（棚から探す）

**読む**
- Areas（工場/エリア）
- Maps（上面図）
- Shelves（上面図座標）
- Bins（側面図座標）
- Inventory（棚/段の在庫一覧）

**書く**
- （なし）

---

## 5) マップ編集モード（在庫担当）

**読む**
- Areas / Maps / Shelves / Bins

**書く**
- Maps（画像fileId更新）
- Shelves（上面図座標、棚画像）
- Bins（側面図座標、段写真）

---

## 6) サイズ設定画面（在庫担当）

**読む**
- Inventory（現在size_class）
- Lookups（サイズ候補）

**書く**
- Inventory.size_class（更新）
- Inventory.updated_at/updated_by
- （任意）サイズ変更履歴（AuditLog）

---

## 7) 冒険者一覧（若手キャラ比較）

**読む**
- Users（表示名）
- CharacterProfiles（アバター等）
- UserStatsCache（period指定：xp/level/uses/views）

**書く**
- （なし）

---

## 8) キャラ詳細ページ（若手）

**読む**
- Periods（◀▶、月ドロップダウン）
- Goals（共通/個人：period指定）
- UserStatsCache（period指定）
- UserBadges（period指定）
- UsageLog（period内、写真付き一覧にするなら）
- Inventory（使用履歴に写真/名称を付ける）
- ViewLog（閲覧数の根拠：集計済ならUserStatsCache）

**書く**
- （原則なし）
- （閲覧を記録するなら）ViewLog（ページ閲覧時に追記）

---

## 9) 社長向け公式レポート（全体＋個人）

**読む**
- Periods（上半期/下半期）
- UsageLog（期間内）
- Inventory（写真/名称）
- Users（表示名）
- ViewLog or UserStatsCache（閲覧回数）

**書く**
- ReportRuns（出力履歴）
- Report_Official（生成結果：任意）
- PDFのDrive保存fileId（任意）

---

# 次のステップ

次は **③ 画面設計（UI一覧＋各画面の入出力＋状態遷移＋エラーハンドリング）** を、コーディングエージェントがそのまま実装できるレベルでまとめます。

進め方は、実装の順番に合わせて：
1. ログイン
2. 在庫一覧 → 在庫詳細（使用確定・チャット・添付）
3. 棚マップ → マップ編集モード
4. サイズ設定
5. 若手RPG（一覧→詳細）
6. 社長レポート（印刷/PDF）

この順で一気に固めます。
