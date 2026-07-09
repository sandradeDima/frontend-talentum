import { requestApiClient } from '@/lib/api-client-browser';
import type {
  CoolturaConfig,
  SendCoolturaTestEmailInput,
  SendCoolturaTestEmailResult,
  UpsertCoolturaConfigInput
} from '@/types/cooltura-config';

export const getCoolturaConfigClient = async () => {
  return requestApiClient<CoolturaConfig>('/cooltura-config');
};

export const upsertCoolturaConfigClient = async (input: UpsertCoolturaConfigInput) => {
  return requestApiClient<CoolturaConfig>('/cooltura-config', {
    method: 'PUT',
    body: JSON.stringify(input)
  });
};

export const sendCoolturaTestEmailClient = async (input: SendCoolturaTestEmailInput) => {
  return requestApiClient<SendCoolturaTestEmailResult>('/cooltura-config/test-email', {
    method: 'POST',
    body: JSON.stringify(input)
  });
};
