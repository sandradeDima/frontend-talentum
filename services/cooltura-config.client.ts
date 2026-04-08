import { requestApiClient } from '@/lib/api-client-browser';
import type { CoolturaConfig, UpsertCoolturaConfigInput } from '@/types/cooltura-config';

export const getCoolturaConfigClient = async () => {
  return requestApiClient<CoolturaConfig>('/cooltura-config');
};

export const upsertCoolturaConfigClient = async (input: UpsertCoolturaConfigInput) => {
  return requestApiClient<CoolturaConfig>('/cooltura-config', {
    method: 'PUT',
    body: JSON.stringify(input)
  });
};
