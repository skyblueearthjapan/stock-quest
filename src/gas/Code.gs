function doGet(e) {
  try {
    const page = (e && e.parameter && e.parameter.page) ? e.parameter.page : 'home';

    if (page === 'login') return render_('login', {});
    if (page === 'logout') {
      logout_();
      return render_('login', { message: 'ログアウトしました' });
    }

    // homeはログイン必須にする（未ログインならloginを表示）
    if (page === 'home') {
      const u = currentUser_();
      if (!u) return render_('login', { message: 'ログインしてください' });
      let cfg = {};
      try {
        cfg = getConfigMap_();
      } catch (configErr) {
        cfg = { error: configErr.message };
      }
      return render_('home', { config: cfg });
    }

    // 未定義ルート
    return renderError_(new Error('PAGE_NOT_FOUND: ' + page), { page });
  } catch (err) {
    return renderError_(err, { page: (e && e.parameter && e.parameter.page) });
  }
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
