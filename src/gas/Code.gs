function doGet(e) {
  const page = (e && e.parameter && e.parameter.page) ? e.parameter.page : 'login';
  const isGuest = (e && e.parameter && e.parameter.guest === '1');

  try {
    // 1) ログイン画面は常に表示OK
    if (page === 'login') return render_('login', {});

    // 2) ログアウト：JSリダイレクト禁止 → loginを直接返す
    if (page === 'logout') {
      logout_();
      return render_('login', { logged_out: true });
    }

    // 3) ここから先は「ログイン or ゲスト」ならOK
    const u = currentUser_();
    if (!u && !isGuest) {
      return render_('login', { need_login: true });
    }

    // 4) 入口は inventory（フェーズ2）
    if (page === 'home') {
      // homeは廃止でもOK。inventoryへ案内ページを返す
      return HtmlService.createHtmlOutput(
        '<meta http-equiv="refresh" content="0;url=?page=inventory' + (isGuest ? '&guest=1' : '') + '">' +
        '<div style="font-family:system-ui;padding:16px;">Redirecting...</div>'
      );
    }

    if (page === 'inventory') {
      return render_('inventory', { guest: isGuest });
    }

    if (page === 'inv_detail') {
      const id = (e.parameter && e.parameter.id) ? String(e.parameter.id) : '';
      return render_('inventory_detail', { inventory_id: id, guest: isGuest });
    }

    // 未定義
    return renderError_(new Error('PAGE_NOT_FOUND: ' + page), { page, params: e.parameter });
  } catch (err) {
    return safePlainError_(err, { page, params: (e && e.parameter) });
  }
}

/** 最終退避：テンプレが壊れても必ず出す */
function safePlainError_(err, context) {
  const msg = (err && err.message) ? err.message : String(err);
  const html =
    '<div style="font-family:system-ui; padding:16px;">' +
    '<h2>App Error</h2>' +
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
