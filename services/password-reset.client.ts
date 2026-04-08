import { requestApiClient } from '@/lib/api-client-browser';
import type { ConfirmPasswordResetInput } from '@/types/password-reset';

export const confirmPasswordResetClient = async (input: ConfirmPasswordResetInput) => {
  return requestApiClient<{ email: string }>('/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify(input)
  });
};
