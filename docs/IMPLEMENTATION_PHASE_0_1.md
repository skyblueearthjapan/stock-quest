# 実装フェーズ0〜1：コーディングエージェントへの指示

## 目的（今回の納品物）

- GAS Webアプリがデプロイでき、トップが表示される
- Spreadsheet（v5）に接続できる
- 名前＋PINでログインできる
- ログイン後、ヘッダーに「ログイン中：表示名（role）」が出る
- 以降のフェーズ（在庫一覧・詳細など）に拡張しやすい構造

## 制約

- v5スプレッドシートの シート名・列名は変更しない
- ログ系（UsageLog/ViewLog/ChatMessages）は追記のみ（今回フェーズでは触らない）
- 例外で白画面にならない（必ずエラーページ表示）

---

## 推奨アーキテクチャ（GASファイル構成）

GASプロジェクト内に以下ファイルを作る（この名前で）：

- `Code.gs`（エントリ、ルーティング）
- `env.gs`（環境設定：Spreadsheet IDなど）
- `lib_ss.gs`（Spreadsheetアクセス共通）
- `lib_auth.gs`（ログイン・セッション・権限）
- `lib_render.gs`（HTMLテンプレ・共通描画）
- `pages_home.html`
- `pages_login.html`
- `pages_error.html`
- `assets_css.html`（CSSをまとめる）
- `assets_js.html`（共通JS）

---

## フェーズ0：基盤（ルーティング＋テンプレ＋Config読める）

### 完成条件

- `?page=home` でホームが表示
- `?page=login` でログイン画面が表示
- v5 Spreadsheetに接続して Config/Users を読める（最低限）

---

## フェーズ1：ログイン（名前＋PIN）＋セッション保持

### 完成条件

- Usersから表示名候補を検索してログインできる
- user_id / role / display_name をセッションに保持
- home に遷移してヘッダーにログイン情報が出る
- logout でセッションが消える

---

## 重要：PIN管理（現実的な最適解）

今回は「まず動く」を優先しつつも安全寄りにします。

- **推奨**：UserAuth シートを追加（列：user_id, pin_hash, updated_at, updated_by）
- もし追加が難しいなら一時的に Usersに pin_hash 列でもOK
  （ただし平文PINは絶対に保存しない）

PIN入力 → hash化 → pin_hash照合。

---

## テスト手順（デプロイして確認する用）

1. `ENV.SPREADSHEET_ID` と `PIN_SALT` を設定
2. （推奨）UserAuth シートを作る
   - user_id, pin_hash, updated_at, updated_by
3. 任意ユーザーの pin_hash を作る
   - 例：pin=1234, user_id=U-001
   - SHA-256("1234:U-001:SALT") を pin_hash に入れる
4. デプロイして `?page=login` へ
5. 名前候補が出る → PIN入力 → homeへ遷移、ヘッダーにログイン表示

---

## 次（フェーズ2〜3）への接続点

この構造のまま、次は以下を足すだけです。

- `pages_inventory.html`（カテゴリタブ＋一覧）
- `pages_inventory_detail.html`（詳細＋使用確定）
- `api_inventory_list()` / `api_inventory_detail()` / `api_use_confirm()`
