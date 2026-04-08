import { requestApiClient } from '@/lib/api-client-browser';
import type {
  LoginInput,
  LoginResponse,
  MeResponse,
  SocialFinalizeInput,
  SocialFinalizeResponse,
  SocialProvider,
  SocialStartResponse
} from '@/types/auth';

export const loginClient = async (input: LoginInput): Promise<LoginResponse> => {
  return requestApiClient<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input)
  });
};

export const logoutClient = async (): Promise<{ success: boolean }> => {
  return requestApiClient<{ success: boolean }>('/auth/logout', {
    method: 'POST'
  });
};

export const getMeClient = async (): Promise<MeResponse> => {
  return requestApiClient<MeResponse>('/auth/me');
};

export const startSocialSignInClient = async (input: {
  provider: SocialProvider;
  companySlug?: string;
}): Promise<SocialStartResponse> => {
  const query = input.companySlug
    ? `?companySlug=${encodeURIComponent(input.companySlug)}`
    : '';

  return requestApiClient<SocialStartResponse>(
    `/auth/social/${encodeURIComponent(input.provider)}/start${query}`
  );
};

export const finalizeSocialSignInClient = async (
  input: SocialFinalizeInput
): Promise<SocialFinalizeResponse> => {
  return requestApiClient<SocialFinalizeResponse>('/auth/social/finalize', {
    method: 'POST',
    body: JSON.stringify(input)
  });
};
