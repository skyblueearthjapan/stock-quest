function doGet(e) {
  try {
    const page = (e && e.parameter && e.parameter.page) ? e.parameter.page : 'home';

    if (page === 'login') return render_('login', {});
    if (page === 'logout') {
      logout_();
      return HtmlService.createHtmlOutput('<script>location.href="?page=login";</script>');
    }

    // homeはログイン必須にする（未ログインならloginへ）
    if (page === 'home') {
      const u = currentUser_();
      if (!u) return HtmlService.createHtmlOutput('<script>location.href="?page=login";</script>');
      const cfg = getConfigMap_();
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
