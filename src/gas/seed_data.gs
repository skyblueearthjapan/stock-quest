/**
 * seedRunAll()
 * Inventory / Users / UsageLog / Attachments に最小Seedを投入する（重複チェック＆追記）
 * - ヘッダー名ベースで列に自動配置（列順が違ってもOK）
 * - ヘッダー行は先頭30行から自動検出
 * - uniqueKey（例 inventory_id / user_id / usage_id / attachment_id）が重複ならスキップ
 * - "__NOW__" を ISO文字列に置換
 *
 * 使い方：
 * 1) GASエディタで seedRunAll() を実行
 */
function seedRunAll() {
  const ss = SpreadsheetApp.openById(ENV.SSID);
  const now = new Date().toISOString();

  // ▼必要ならここだけ実際のシート名に合わせて変更
  const SHEET_NAMES = {
    inventory: 'Inventory',
    users: 'Users',
    usageLog: 'UsageLog',
    attachments: 'Attachments',
    lookups: 'Lookups',
  };

  // 0) Lookups（カテゴリタブが動くように）
  seedSheet_({
    ss,
    sheetName: SHEET_NAMES.lookups,
    uniqueKey: 'カテゴリ',
    requiredKey: 'カテゴリ',
    seedCols: ['カテゴリ'],
    seeds: [
      ['ドグ'],
      ['ストッパー'],
      ['面板'],
    ],
  });

  // 1) Users（管理者1 + 利用者2）
  seedSheet_({
    ss,
    sheetName: SHEET_NAMES.users,
    uniqueKey: 'user_id',
    requiredKey: 'user_id',
    seedCols: [
      'user_id', 'display_name', 'pin', 'role', 'is_active',
      'created_at', 'created_by', 'updated_at', 'updated_by', 'notes'
    ],
    seeds: [
      // admin（在庫管理担当）
      ['STOCK_ADMIN', '在庫管理者（SEED）', '1234', 'admin', true, '__NOW__', 'seed', '__NOW__', 'seed', '在庫管理担当（管理者）'],
      // user（機械設計）
      ['ENG_001', '設計 太郎（SEED）', '1111', 'user', true, '__NOW__', 'seed', '__NOW__', 'seed', '機械設計ユーザー'],
      ['ENG_002', '設計 花子（SEED）', '2222', 'user', true, '__NOW__', 'seed', '__NOW__', 'seed', '機械設計ユーザー'],
    ].map(r => r.map(v => v === '__NOW__' ? now : v)),
  });

  // 2) Inventory（テスト用3件）
  seedSheet_({
    ss,
    sheetName: SHEET_NAMES.inventory,
    uniqueKey: 'inventory_id',
    requiredKey: 'inventory_id',
    seedCols: [
      'inventory_id','part_name','category','qty','unit','size_class','rarity','status',
      'confirm_date','source_work_no','location_id','bin_id','shelf_id','site_id_cache',
      'area_id_cache','location_text_cache','primary_image_fileId','drive_folder_id',
      'notes','created_at','created_by','updated_at','updated_by'
    ],
    seeds: [
      [
        "INV-SEED-001","ドグ Aタイプ（SEED）","ドグ",3,"pcs","中","R1","IN_STOCK","",
        "LW-SEED-0001","LOC-001","","","","","本社_棚A-2-3（SEED）","","","Seed投入テスト用。",
        "__NOW__","seed","__NOW__","seed"
      ],
      [
        "INV-SEED-002","ストッパー 20mm（SEED）","ストッパー",0,"pcs","小","R2","OUT_OF_STOCK","",
        "LW-SEED-0002","LOC-001","","","","","本社_棚B-1-1（SEED）","","","在庫0表示確認用。",
        "__NOW__","seed","__NOW__","seed"
      ],
      [
        "INV-SEED-003","面板 200x300（SEED）","面板",1,"pcs","大","R1","IN_STOCK","",
        "LW-SEED-0003","LOC-002","","","","","第二倉庫_棚C-3-2（SEED）","","","カテゴリ/検索確認用。",
        "__NOW__","seed","__NOW__","seed"
      ],
    ].map(r => r.map(v => v === '__NOW__' ? now : v)),
  });

  // 3) Attachments（最小：INV-SEED-001 にPDF/画像の"リンク表示確認用"を2件）
  seedSheet_({
    ss,
    sheetName: SHEET_NAMES.attachments,
    uniqueKey: 'attachment_id',
    requiredKey: 'inventory_id',
    seedCols: [
      'attachment_id','inventory_id','type','file_name','fileId','mime_type',
      'notes','created_at','created_by','updated_at','updated_by'
    ],
    seeds: [
      [
        'ATT-SEED-001','INV-SEED-001','図面','図面（SEED）.pdf','',
        'application/pdf',
        'リンク表示確認用（PDF）','__NOW__','seed','__NOW__','seed'
      ],
      [
        'ATT-SEED-002','INV-SEED-001','写真','写真（SEED）.png','',
        'image/png',
        'リンク表示確認用（画像）','__NOW__','seed','__NOW__','seed'
      ],
    ].map(r => r.map(v => v === '__NOW__' ? now : v)),
  });

  // 4) UsageLog（最小：user/admin 両方が"使用確定した履歴"の表示確認用に2件）
  seedSheet_({
    ss,
    sheetName: SHEET_NAMES.usageLog,
    uniqueKey: 'log_id',
    requiredKey: 'inventory_id',
    seedCols: [
      'log_id','timestamp','user_id','action','inventory_id','project_code',
      'qty_delta','points','notes'
    ],
    seeds: [
      [
        'USE-SEED-001','__NOW__','ENG_001','use_confirm','INV-SEED-001','LW-SEED-0001',
        -1, 2, 'Seed使用履歴（user）'
      ],
      [
        'USE-SEED-002','__NOW__','STOCK_ADMIN','use_confirm','INV-SEED-003','LW-SEED-0003',
        -1, 3, 'Seed使用履歴（admin）'
      ],
    ].map(r => r.map(v => v === '__NOW__' ? now : v)),
  });

  Logger.log('seedRunAll: 完了');
}


/**
 * 汎用：シートにSeedを投入（ヘッダー名ベースで列自動配置＋重複チェック）
 */
function seedSheet_(opt) {
  const { ss, sheetName, uniqueKey, requiredKey, seedCols, seeds } = opt;

  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log('seedSheet_: ' + sheetName + ' が見つかりません（スキップ）');
    return;
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 1 || lastCol < 1) {
    Logger.log(sheetName + ': シートが空（ヘッダーなし）のためSeed投入できません');
    return;
  }

  // 1) ヘッダー行を探す（requiredKey または requiredKey*）
  const scanRows = Math.min(lastRow, 30);
  const scan = sheet.getRange(1, 1, scanRows, lastCol).getValues();
  const requiredKeyLower = String(requiredKey).trim().toLowerCase();

  let headerRow = -1;
  for (let r = 0; r < scan.length; r++) {
    const row = scan[r].map(function(v){ return String(v || '').trim(); });
    const hit = row.some(function(h){ return normalizeHeader_(h).toLowerCase() === requiredKeyLower; });
    if (hit) { headerRow = r + 1; break; }
  }
  if (headerRow === -1) {
    Logger.log(sheetName + ': ヘッダー行（' + requiredKey + '）が見つかりません。先頭30行に ' + requiredKey + ' があるか確認してください。');
    return;
  }

  const headers = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0].map(function(h){ return String(h || '').trim(); });
  const headerIndex = {};
  headers.forEach(function(h, i){ headerIndex[normalizeHeader_(h)] = i; }); // 0-based

  // 2) uniqueKey列を取得
  const uniqueKeyIdx = headerIndex[normalizeHeader_(uniqueKey)];
  if (uniqueKeyIdx === undefined) {
    Logger.log(sheetName + ': uniqueKey=' + uniqueKey + ' 列が見つかりません（スキップ）');
    return;
  }

  // 3) 既存キーを収集
  const dataStartRow = headerRow + 1;
  const dataRows = Math.max(0, sheet.getLastRow() - headerRow);

  const existing = {};
  if (dataRows > 0) {
    sheet.getRange(dataStartRow, uniqueKeyIdx + 1, dataRows, 1)
      .getValues()
      .map(function(r){ return String(r[0] || '').trim(); })
      .filter(Boolean)
      .forEach(function(v){ existing[v] = true; });
  }

  // 4) 追記行を組み立て（ヘッダーに存在する列だけ入れる）
  var rowsToAppend = [];
  for (var s = 0; s < seeds.length; s++) {
    var seed = seeds[s];
    var key = String(seed[seedCols.indexOf(uniqueKey)] || seed[0] || '').trim();
    if (!key) continue;
    if (existing[key]) continue;

    var out = [];
    for (var c = 0; c < lastCol; c++) out.push('');

    for (var i = 0; i < seedCols.length; i++) {
      var colName = normalizeHeader_(seedCols[i]);
      if (headerIndex[colName] === undefined) continue;
      out[headerIndex[colName]] = seed[i];
    }
    rowsToAppend.push(out);
  }

  if (rowsToAppend.length === 0) {
    Logger.log(sheetName + ': 追記なし（すべて既に存在）');
    return;
  }

  // 5) 追記
  var appendRow = sheet.getLastRow() + 1;
  sheet.getRange(appendRow, 1, rowsToAppend.length, lastCol).setValues(rowsToAppend);
  Logger.log(sheetName + ': ' + rowsToAppend.length + '件 追記しました');
}

/** ヘッダー正規化：末尾の * を落としてトリム */
function normalizeHeader_(h) {
  return String(h || '').trim().replace(/\*+$/g, '');
}
