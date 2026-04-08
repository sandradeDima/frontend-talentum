import { requestApiServer } from '@/lib/api-client-server';
import type { PasswordResetValidationData } from '@/types/password-reset';

export const validatePasswordResetTokenServer = async (token: string) => {
  const query = new URLSearchParams({ token });
  return requestApiServer<PasswordResetValidationData>(
    `/password-reset/validate?${query.toString()}`
  );
};
