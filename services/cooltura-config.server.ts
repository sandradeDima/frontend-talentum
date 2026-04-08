import { requestApiServer } from '@/lib/api-client-server';
import type { CoolturaConfig } from '@/types/cooltura-config';

export const getCoolturaConfigServer = async () => {
  return requestApiServer<CoolturaConfig>('/cooltura-config');
};
