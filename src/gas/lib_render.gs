function render_(pageName, data) {
  try {
    const tpl = HtmlService.createTemplateFromFile('pages_' + pageName);
    tpl.data = data || {};
    tpl.data.appTitle = ENV.APP_TITLE;

    const isGuest = !!tpl.data.guest;
    const u = currentUser_();
    tpl.data.user = u || (isGuest ? { user_id:'GUEST', role:'guest', display_name:'ゲスト' } : null);

    tpl.include = function(filename) {
      return HtmlService.createHtmlOutputFromFile(filename).getContent();
    };

    return tpl.evaluate()
      .setTitle(ENV.APP_TITLE)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (err) {
    const msg = (err && err.stack) ? err.stack : (err && err.message) ? err.message : String(err);
    return HtmlService.createHtmlOutput(
      '<div style="font-family:system-ui;padding:20px">' +
      '<h2>RENDER ERROR</h2>' +
      '<pre style="white-space:pre-wrap;background:#f6f8fa;padding:12px;border-radius:8px;">' +
      escapeHtml_(msg) + '</pre>' +
      '<p>pageName=' + escapeHtml_(pageName) + '</p>' +
      '</div>'
    );
  }
}

function renderError_(err, context) {
  const msg = (err && err.message) ? err.message : String(err);
  return render_('error', { message: msg, context: context || {} });
}
