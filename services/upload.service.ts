import { requestApiClient } from '@/lib/api-client-browser';

const fileToBase64 = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (let index = 0; index < bytes.byteLength; index += 1) {
    binary += String.fromCharCode(bytes[index] as number);
  }

  return btoa(binary);
};

export const uploadCompanyLogoClient = async (file: File) => {
  const base64 = await fileToBase64(file);

  return requestApiClient<{ logoUrl: string; fileSize: number }>('/uploads/company-logo', {
    method: 'POST',
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type,
      base64
    })
  });
};
