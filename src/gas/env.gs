const ENV = {
  SPREADSHEET_ID: '1C9efggPfVBx1-ZpM5V8KnDAsl-2Js2HLrY-QCKGAENM', // v5をインポートしたSpreadsheet
  APP_TITLE: '在庫管理クエスト',
  SESSION_KEYS: {
    userId: 'iq_user_id',
    role: 'iq_role',
    displayName: 'iq_display_name',
  },
  // PINハッシュ方式：SHA-256( pin + ":" + user_id + ":" + salt )
  PIN_SALT: 'stock-quest-2026-secret',
  SHEETS: {
    CONFIG: 'Config',
    USERS: 'Users',
    USER_AUTH: 'UserAuth', // 推奨。無い場合はUsersのpin_hashで代替
  },
};
