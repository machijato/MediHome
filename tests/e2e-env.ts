// Vjerodajnice za E2E testove dolaze isključivo iz okoline (GitHub secrets / lokalni .env), nikad iz koda.
export function requireEnv(name: 'E2E_AUTH_EMAIL' | 'E2E_AUTH_PASSWORD'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Set it as GitHub secret (CI) or in local .env.`);
  }
  return value;
}
