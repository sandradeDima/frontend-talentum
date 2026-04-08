import { requestApiServer } from '@/lib/api-client-server';
import type { PublicSupportConfigData } from '@/types/support-config';

export const getPublicSupportConfigServer = async (companySlug?: string) => {
  if (companySlug) {
    return requestApiServer<PublicSupportConfigData>(
      `/support-config/public/${encodeURIComponent(companySlug)}`
    );
  }

  return requestApiServer<PublicSupportConfigData>('/support-config/public');
};
