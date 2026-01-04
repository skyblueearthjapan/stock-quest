/**
 * 在庫一覧取得
 */
function inventoryList_(category, q) {
  const hdr = ENV.HDR_ROW;
  const inv = readTable_('Inventory', hdr).rows;
  const look = readTable_('Lookups', hdr).rows;

  // カテゴリ一覧（Lookups.カテゴリ列の非空を列挙）
  const categories = [];
  look.forEach(r => {
    const v = r['カテゴリ'];
    if (v && !categories.includes(String(v))) categories.push(String(v));
  });

  const cat = String(category || '').trim();
  const key = String(q || '').trim().toLowerCase();

  let filtered = inv;

  if (cat) filtered = filtered.filter(r => String(r['category'] || r['カテゴリ'] || '').trim() === cat);

  if (key) {
    filtered = filtered.filter(r => {
      const id = String(r['inventory_id'] || '').toLowerCase();
      const name = String(r['part_name'] || '').toLowerCase();
      return id.includes(key) || name.includes(key);
    });
  }

  // 表示用に必要項目だけ整形
  const items = filtered.slice(0, 500).map(r => ({
    inventory_id: String(r['inventory_id'] || ''),
    part_name: String(r['part_name'] || ''),
    category: String(r['category'] || ''),
    qty: Number(r['qty'] || 0),
    size_class: String(r['size_class'] || ''),
    primary_image_fileId: String(r['primary_image_fileId'] || ''),
  }));

  return { categories, items };
}

/**
 * 在庫詳細取得
 */
function inventoryDetail_(inventoryId) {
  const hdr = ENV.HDR_ROW;
  const invRows = readTable_('Inventory', hdr).rows;
  const atRows  = readTable_('Attachments', hdr).rows;

  const id = String(inventoryId || '').trim();
  const inv = invRows.find(r => String(r['inventory_id'] || '') === id);
  if (!inv) throw new Error('INVENTORY_NOT_FOUND');

  const attachments = atRows
    .filter(a => String(a['inventory_id'] || '') === id)
    .map(a => ({
      attachment_id: String(a['attachment_id'] || ''),
      type: String(a['type'] || ''),
      fileId: String(a['fileId'] || ''),
      file_name: String(a['file_name'] || ''),
      mime_type: String(a['mime_type'] || ''),
    }));

  return {
    inventory: {
      inventory_id: String(inv['inventory_id'] || ''),
      part_name: String(inv['part_name'] || ''),
      category: String(inv['category'] || ''),
      qty: Number(inv['qty'] || 0),
      size_class: String(inv['size_class'] || ''),
      status: String(inv['status'] || ''),
      notes: String(inv['notes'] || ''),
      primary_image_fileId: String(inv['primary_image_fileId'] || ''),
    },
    attachments
  };
}

/**
 * 使用確定処理
 */
function useConfirm_(payload) {
  // payload: {inventory_id, qty, project_code, note}
  const hdr = ENV.HDR_ROW;
  const u = requireLogin_();

  const inventoryId = String(payload.inventory_id || '').trim();
  const qtyUse = Number(payload.qty || 1);
  const project = String(payload.project_code || '').trim();
  const note = String(payload.note || '').trim();

  if (!inventoryId) throw new Error('INV_ID_REQUIRED');
  if (!Number.isFinite(qtyUse) || qtyUse <= 0) throw new Error('QTY_INVALID');
  if (!project) throw new Error('PROJECT_CODE_REQUIRED');

  const invTable = readTable_('Inventory', hdr);
  const invRows = invTable.rows;

  // 在庫行特定（行番号も必要）
  const sheet = invTable.sheet;
  const values = sheet.getDataRange().getValues();
  const headers = values[hdr - 1];

  let targetRowIndex1 = -1; // シート上の1-index行番号
  let inv = null;

  for (let r = hdr; r < values.length; r++) {
    const row = values[r];
    const idxId = headers.indexOf('inventory_id');
    if (idxId < 0) throw new Error('Inventory.inventory_id header missing');
    if (String(row[idxId] || '') === inventoryId) {
      targetRowIndex1 = r + 1; // valuesは0-index
      inv = invRows.find(x => String(x['inventory_id'] || '') === inventoryId);
      break;
    }
  }
  if (!inv || targetRowIndex1 < 0) throw new Error('INVENTORY_NOT_FOUND');

  const currentQty = Number(inv['qty'] || 0);
  if (currentQty - qtyUse < 0) throw new Error('QTY_INSUFFICIENT');

  // PointRulesからpoints取得（size_class→points）
  const pr = readTable_('PointRules', hdr).rows;
  const size = String(inv['size_class'] || '');
  const rule = pr.find(r => String(r['size_class'] || '') === size && String(r['mode'] || '') === 'use_confirm');
  const pointsPer = rule ? Number(rule['points'] || 0) : 0;
  const points = pointsPer * qtyUse;

  // 1) Inventory.qty 更新
  const idxQty = headers.indexOf('qty');
  if (idxQty < 0) throw new Error('Inventory.qty header missing');
  sheet.getRange(targetRowIndex1, idxQty + 1).setValue(currentQty - qtyUse);

  // 2) UsageLog 追記
  const logSheet = sh_('UsageLog');
  const logValues = logSheet.getDataRange().getValues();
  const logHeaders = logValues[hdr - 1];
  const logRow = {};
  logHeaders.forEach(h => { if (h) logRow[h] = ''; });

  const logId = 'L-' + Utilities.getUuid().slice(0, 8).toUpperCase();
  const ts = new Date();

  // ヘッダー名に合わせて設定（*付きの場合も考慮）
  const setLogValue = (key, value) => {
    if (logRow.hasOwnProperty(key)) logRow[key] = value;
    if (logRow.hasOwnProperty(key + '*')) logRow[key + '*'] = value;
  };

  setLogValue('log_id', logId);
  setLogValue('timestamp', ts);
  setLogValue('user_id', u.user_id);
  setLogValue('action', 'use_confirm');
  setLogValue('inventory_id', inventoryId);
  setLogValue('project_code', project);
  setLogValue('qty_delta', -qtyUse);
  setLogValue('points', points);
  setLogValue('notes', note);

  const out = logHeaders.map(h => (h ? logRow[h] : ''));
  logSheet.appendRow(out);

  return { ok: true, inventory_id: inventoryId, qty_after: currentQty - qtyUse, points };
}
