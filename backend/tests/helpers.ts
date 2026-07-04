export function setTestEnv() {
  process.env.NODE_ENV = 'test';
  process.env.DB_HOST = process.env.DB_HOST || 'localhost';
  process.env.DB_PORT = process.env.DB_PORT || '3306';
  process.env.DB_USER = process.env.DB_USER || 'test';
  process.env.DB_PASS = process.env.DB_PASS || 'test';
  process.env.DB_NAME = process.env.DB_NAME || 'thrivefund_test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_32_characters_min';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_32_chars_min';
  process.env.BREVO_API_KEY = process.env.BREVO_API_KEY || 'test_brevo';
  process.env.BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@example.com';
  process.env.NOMBA_CLIENT_ID = process.env.NOMBA_CLIENT_ID || 'test_client_id';
  process.env.NOMBA_PRIVATE_KEY = process.env.NOMBA_PRIVATE_KEY || 'test_private_key';
  process.env.NOMBA_PARENT_ACCOUNT_ID = process.env.NOMBA_PARENT_ACCOUNT_ID || 'parent_account_id';
  process.env.NOMBA_SUB_ACCOUNT_ID = process.env.NOMBA_SUB_ACCOUNT_ID || 'sub_account_id';
  process.env.NOMBA_VIRTUAL_ACCOUNT_SCOPE = process.env.NOMBA_VIRTUAL_ACCOUNT_SCOPE || 'sub_account';
  process.env.COLLECTION_GRACE_DAYS = process.env.COLLECTION_GRACE_DAYS || '0';
}

export function jsonResponse(body: unknown, init: { status?: number; ok?: boolean } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    text: async () => JSON.stringify(body),
  } as Response;
}
