function session_() {
  return PropertiesService.getUserProperties();
}

function currentUser_() {
  const p = session_();
  const userId = p.getProperty(ENV.SESSION_KEYS.userId);
  if (!userId) return null;
  return {
    user_id: userId,
    role: p.getProperty(ENV.SESSION_KEYS.role) || '',
    display_name: p.getProperty(ENV.SESSION_KEYS.displayName) || '',
  };
}

function requireLogin_() {
  const u = currentUser_();
  if (!u) throw new Error('NOT_LOGGED_IN');
  return u;
}

function logout_() {
  const p = session_();
  Object.values(ENV.SESSION_KEYS).forEach(k => p.deleteProperty(k));
}

function pinHash_(pin, userId) {
  const raw = `${pin}:${userId}:${ENV.PIN_SALT}`;
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw);
  return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

/**
 * UserAuthがあればそこから、無ければUsers.pin_hashから照合
 */
function getPinHashForUser_(userId, usersRowOpt) {
  // 1) UserAuthがあるか試す
  try {
    const sheet = ss_().getSheetByName(ENV.SHEETS.USER_AUTH);
    if (sheet) {
      const values = sheet.getDataRange().getValues();
      // headerは3行目想定
      const headers = values[2];
      const startRow = 3;
      const idxUser = headers.indexOf('user_id');
      const idxHash = headers.indexOf('pin_hash');
      for (let r = startRow; r < values.length; r++) {
        const row = values[r];
        if (row[idxUser] === userId) return String(row[idxHash] || '');
      }
    }
  } catch (e) {
    // ignore
  }
  // 2) Users側にpin_hashがある想定
  if (usersRowOpt && usersRowOpt['pin_hash']) return String(usersRowOpt['pin_hash']);
  return '';
}

function loginByNameAndPin_(displayName, pin) {
  const users = readUsers_();
  const user = users.find(u =>
    String(u['display_name'] || '').trim() === String(displayName).trim() &&
    Number(u['is_active'] || 0) === 1
  );
  if (!user) throw new Error('USER_NOT_FOUND_OR_INACTIVE');

  const userId = String(user['user_id']);
  const expectedHash = getPinHashForUser_(userId, user);
  if (!expectedHash) throw new Error('PIN_NOT_SET');

  const inputHash = pinHash_(String(pin), userId);
  if (inputHash !== expectedHash) throw new Error('PIN_MISMATCH');

  const p = session_();
  p.setProperty(ENV.SESSION_KEYS.userId, userId);
  p.setProperty(ENV.SESSION_KEYS.role, String(user['role'] || 'designer'));
  p.setProperty(ENV.SESSION_KEYS.displayName, String(user['display_name'] || ''));

  return currentUser_();
}

/**
 * ログイン候補検索（部分一致）
 */
function searchUserCandidates_(q) {
  const users = readUsers_();
  const key = String(q || '').trim().toLowerCase();
  return users
    .filter(u => Number(u['is_active'] || 0) === 1)
    .filter(u => !key || String(u['display_name'] || '').toLowerCase().includes(key))
    .slice(0, 20)
    .map(u => ({
      display_name: String(u['display_name'] || ''),
      role: String(u['role'] || ''),
    }));
}
