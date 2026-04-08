import { env } from '@/lib/env';

export const resolvePublicAssetUrl = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  return `${env.backendOrigin}${value.startsWith('/') ? value : `/${value}`}`;
};
