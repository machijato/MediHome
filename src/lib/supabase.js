export const RESET_PASSWORD_RATE_LIMIT_MESSAGE =
  'Previše zahtjeva u kratkom vremenu. Pričekajte nekoliko minuta i pokušajte ponovno.';

export const RESET_PASSWORD_GENERIC_ERROR_MESSAGE = 'Došlo je do greške. Pokušajte ponovno.';

export function getResetPasswordErrorMessage(error) {
  const rawMessage = error?.message?.trim() ?? '';

  if (rawMessage.toLowerCase().includes('rate limit')) {
    return RESET_PASSWORD_RATE_LIMIT_MESSAGE;
  }

  return rawMessage || RESET_PASSWORD_GENERIC_ERROR_MESSAGE;
}

export async function resetPasswordForEmail(supabase, email, options) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, options);

  if (error) {
    throw new Error(getResetPasswordErrorMessage(error));
  }
}
