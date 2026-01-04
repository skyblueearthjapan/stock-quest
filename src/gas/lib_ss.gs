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

/**
 * 汎用テーブル読込（ヘッダー行指定）
 */
function readTable_(sheetName, headerRow) {
  const sheet = sh_(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length <= headerRow) return { headers: [], rows: [], sheet };

  const headers = values[headerRow - 1]; // 1-index
  const startRow = headerRow;            // 次の行からデータ
  const rows = [];

  for (let r = startRow; r < values.length; r++) {
    const row = values[r];
    if (!row || row.every(v => v === '' || v === null)) continue;
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      const h = headers[c];
      if (!h) continue;
      obj[String(h)] = row[c];
    }
    rows.push(obj);
  }
  return { headers, rows, sheet };
}

/**
 * 特定セルに値を書き込む（ヘッダー名指定）
 */
function writeCellByHeader_(sheetName, headerRow, rowIndex1, headerName, value) {
  const t = readTable_(sheetName, headerRow);
  const idx = t.headers.indexOf(headerName);
  if (idx < 0) throw new Error(`Header not found: ${sheetName}.${headerName}`);
  // rowIndex1: シート上の実行行番号（1-index）
  t.sheet.getRange(rowIndex1, idx + 1).setValue(value);
}
