const configuredBackendApiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:4000/api';

const backendApiUrl = configuredBackendApiUrl.replace(/\/+$/, '');
const backendOrigin = backendApiUrl.replace(/\/api\/?$/, '');

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  apiUrl: '/api',
  backendApiUrl,
  backendOrigin
};
