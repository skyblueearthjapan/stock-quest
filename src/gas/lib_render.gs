function render_(pageName, data) {
  const tpl = HtmlService.createTemplateFromFile('pages_' + pageName);
  tpl.data = data || {};
  tpl.data.appTitle = ENV.APP_TITLE;

  // ★ここが重要：未ログインでも guest=1 なら user を作る
  const isGuest = !!(tpl.data && tpl.data.guest);
  const u = currentUser_();
  tpl.data.user = u || (isGuest ? { user_id: 'GUEST', role: 'guest', display_name: 'ゲスト' } : null);

  tpl.include = function(filename) {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  };

  return tpl.evaluate()
    .setTitle(ENV.APP_TITLE)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function renderError_(err, context) {
  const msg = (err && err.message) ? err.message : String(err);
  return render_('error', { message: msg, context: context || {} });
}
