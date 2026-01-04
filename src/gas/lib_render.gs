function render_(pageName, data) {
  try {
    const tpl = HtmlService.createTemplateFromFile('pages_' + pageName);
    tpl.data = data || {};

    // appTitleが無ければ設定
    if (!tpl.data.appTitle) {
      tpl.data.appTitle = ENV.APP_TITLE;
    }

    // userが無ければゲスト判定して設定
    if (!tpl.data.user && tpl.data.guest) {
      tpl.data.user = { user_id: 'GUEST', role: 'guest', display_name: 'ゲスト' };
    }

    // include関数をテンプレートに渡す
    tpl.include = function(filename) {
      return HtmlService.createHtmlOutputFromFile(filename).getContent();
    };

    return tpl.evaluate()
      .setTitle(tpl.data.appTitle || '在庫管理クエスト')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (err) {
    const msg = (err && err.stack) ? err.stack : (err && err.message) ? err.message : String(err);
    return HtmlService.createHtmlOutput(
      '<div style="font-family:system-ui;padding:16px">' +
      '<h2 style="color:#b91c1c;margin:0 0 8px">RENDER ERROR</h2>' +
      '<div style="margin-bottom:8px;">page=<code>' + escapeHtml_(pageName) + '</code></div>' +
      '<pre style="white-space:pre-wrap;background:#f6f8fa;padding:12px;border-radius:8px;overflow-x:auto;">' +
      escapeHtml_(msg) + '</pre>' +
      '<p style="margin-top:12px;"><a href="?page=login">Go to login</a> | <a href="?page=ping">ping</a></p>' +
      '</div>'
    );
  }
}

function renderError_(err, context) {
  const msg = (err && err.message) ? err.message : String(err);
  return render_('error', { message: msg, context: context || {} });
}
