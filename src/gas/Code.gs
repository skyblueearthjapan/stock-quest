function doGet(e) {
  const page = (e && e.parameter && e.parameter.page) ? e.parameter.page : 'login';
  const data = buildData_(e);

  try {
    // pingは最優先（デバッグ用）
    if (page === 'ping') {
      return HtmlService.createHtmlOutput(
        '<div style="font-family:system-ui;padding:20px">' +
        '<h2>PING OK</h2>' +
        '<pre>' + JSON.stringify({time:new Date().toISOString(), params:(e && e.parameter)||{}}, null, 2) + '</pre>' +
        '</div>'
      );
    }

    // ログイン画面
    if (page === 'login') {
      return render_('login', data);
    }

    // ログアウト
    if (page === 'logout') {
      logout_();
      data.logged_out = true;
      return render_('login', data);
    }

    // ここから先は「ログイン or ゲスト」必須
    if (!data.user && !data.guest) {
      data.need_login = true;
      return render_('login', data);
    }

    // home → inventory へリダイレクト（baseUrl使用）
    if (page === 'home') {
      const redirectUrl = data.baseUrl + '?page=inventory' + (data.guest ? '&guest=1' : '') + '&t=' + Date.now();
      return HtmlService.createHtmlOutput(
        '<meta http-equiv="refresh" content="0;url=' + redirectUrl + '">' +
        '<div style="font-family:system-ui;padding:16px;">Redirecting...</div>'
      );
    }

    // 在庫一覧
    if (page === 'inventory') {
      return render_('inventory', data);
    }

    // 在庫詳細
    if (page === 'inv_detail') {
      data.inventory_id = (e.parameter && e.parameter.id) ? String(e.parameter.id) : '';
      return render_('inventory_detail', data);
    }

    // 未定義ページ → inventoryへフォールバック
    return render_('inventory', data);

  } catch (err) {
    return safePlainError_(err, { page, params: (e && e.parameter) });
  }
}

/** データ構築（全ページ共通） */
function buildData_(e) {
  const isGuest = (e && e.parameter && e.parameter.guest === '1');
  const u = currentUser_();

  return {
    appTitle: ENV.APP_TITLE,
    baseUrl: ScriptApp.getService().getUrl(), // ★必須：/exec のURL（userCodeAppPanel回避）
    guest: isGuest,
    user: u || (isGuest ? { user_id: 'GUEST', role: 'guest', display_name: 'ゲスト' } : null)
  };
}

/** 最終退避：テンプレが壊れても必ず出す */
function safePlainError_(err, context) {
  const msg = (err && err.stack) ? err.stack : (err && err.message) ? err.message : String(err);
  const html =
    '<div style="font-family:system-ui; padding:16px;">' +
    '<h2 style="color:#b91c1c;margin:0 0 8px;">App Error</h2>' +
    '<pre style="white-space:pre-wrap; background:#f6f8fa; padding:12px; border-radius:8px;">' +
    escapeHtml_(msg) + '\n\n' + escapeHtml_(JSON.stringify(context || {}, null, 2)) +
    '</pre>' +
    '<p><a href="?page=login">Go to login</a></p>' +
    '</div>';
  return HtmlService.createHtmlOutput(html).setTitle('Error');
}

function escapeHtml_(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * クライアントから呼ぶAPI（ログイン）
 */
function api_login(displayName, pin) {
  return loginByNameAndPin_(displayName, pin);
}

function api_searchUsers(q) {
  return searchUserCandidates_(q);
}

function api_guestLogin() {
  return guestLogin_();
}

function api_logout() {
  logout_();
  return { success: true };
}

// デバッグ用：JS→サーバー通信テスト
function api_ping() {
  return { ok: true, time: new Date().toISOString() };
}

// ========== 在庫関連API ==========

function api_inventoryList(category, q, isGuest) {
  const u = currentUser_();
  if (!u && !isGuest) throw new Error('NOT_LOGGED_IN');
  return inventoryList_(category, q);
}

function api_inventoryDetail(inventoryId, isGuest) {
  const u = currentUser_();
  if (!u && !isGuest) throw new Error('NOT_LOGGED_IN');
  return inventoryDetail_(inventoryId);
}

function api_useConfirm(payload) {
  // guest禁止
  requireRole_(['designer', 'stock_staff', 'admin']);
  return useConfirm_(payload);
}

/**
 * 管理者用：PINハッシュ生成ツール
 * GASエディタで実行：generatePinHash_('1234', 'U-001')
 * → 結果をUserAuthシートのpin_hash列に貼り付ける
 */
function generatePinHash_(pin, userId) {
  const hash = pinHash_(String(pin), String(userId));
  Logger.log(`PIN: ${pin}, User: ${userId}`);
  Logger.log(`Hash: ${hash}`);
  return hash;
}

/**
 * 一括生成例：全ユーザーに同じPIN（例：1234）を設定
 * GASエディタで実行してログを確認
 */
function generateAllPinHashes_() {
  const users = readUsers_();
  const defaultPin = '1234'; // 初期PIN

  Logger.log('=== PIN Hash一覧（UserAuthシートに貼り付け用）===');
  Logger.log('user_id\tpin_hash');

  users.forEach(u => {
    const userId = String(u['user_id'] || '');
    if (!userId) return;
    const hash = pinHash_(defaultPin, userId);
    Logger.log(`${userId}\t${hash}`);
  });
}
