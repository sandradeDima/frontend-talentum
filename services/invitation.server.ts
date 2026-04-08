import { requestApiServer } from '@/lib/api-client-server';
import type { InvitationValidationData } from '@/types/invitation';

export const validateInvitationTokenServer = async (token: string) => {
  const query = new URLSearchParams({ token });
  return requestApiServer<InvitationValidationData>(
    `/invitations/validate?${query.toString()}`
  );
};
