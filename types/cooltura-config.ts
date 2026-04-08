export type CoolturaConfig = {
  linkedinUrl: string | null;
  youtubeUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  whatsappLink: string | null;
  boliviaDireccion: string | null;
  boliviaTelefono: string | null;
  boliviaEmail: string | null;
  paraguayDireccion: string | null;
  paraguayTelefono: string | null;
  paraguayEmail: string | null;
  updatedAt: string | null;
};

export type UpsertCoolturaConfigInput = Omit<CoolturaConfig, 'updatedAt'>;
