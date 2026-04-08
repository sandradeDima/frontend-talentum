import { requestApiClient } from '@/lib/api-client-browser';
import type { AcceptInvitationData, AcceptInvitationInput } from '@/types/invitation';

export const acceptInvitationClient = async (input: AcceptInvitationInput) => {
  return requestApiClient<AcceptInvitationData>('/invitations/accept', {
    method: 'POST',
    body: JSON.stringify(input)
  });
};
