function ss_() {
  return SpreadsheetApp.openById(ENV.SPREADSHEET_ID);
}

function sh_(name) {
  const sheet = ss_().getSheetByName(name);
  if (!sheet) throw new Error(`Sheet not found: ${name}`);
  return sheet;
}

function getConfigMap_() {
  const sheet = sh_(ENV.SHEETS.CONFIG);
  const values = sheet.getDataRange().getValues();
  // 想定：key, value, 説明 のような構造（ヘッダー1行）
  const map = {};
  for (let i = 1; i < values.length; i++) {
    const key = values[i][0];
    const val = values[i][1];
    if (key) map[String(key)] = val;
  }
  return map;
}

/**
 * Usersをヘッダー行からオブジェクト配列化
 */
function readUsers_() {
  const sheet = sh_(ENV.SHEETS.USERS);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[2]; // v5テンプレはヘッダーが3行目想定（必要なら調整）
  const startRow = 3;
  const rows = [];
  for (let r = startRow; r < values.length; r++) {
    const row = values[r];
    if (!row || row.every(v => v === '' || v === null)) continue;
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      if (!headers[c]) continue;
      obj[String(headers[c])] = row[c];
    }
    rows.push(obj);
  }
  return rows;
}
