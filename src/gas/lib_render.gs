function render_(pageName, data) {
  const tpl = HtmlService.createTemplateFromFile('pages_' + pageName);
  tpl.data = data || {};
  tpl.data.appTitle = ENV.APP_TITLE;
  tpl.data.user = currentUser_();
  tpl.include = function(filename) {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  };
  const html = tpl.evaluate()
    .setTitle(ENV.APP_TITLE)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return html;
}

function renderError_(err, context) {
  const msg = (err && err.message) ? err.message : String(err);
  return render_('error', { message: msg, context: context || {} });
}
