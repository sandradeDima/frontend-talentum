export type CompanyBranding = {
  companyName: string;
  topRightLogoUrl?: string | null;
  socialLinks: {
    linkedin?: string | null;
    youtube?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    tiktok?: string | null;
    spotify?: string | null;
  };
  supportWhatsappPhone?: string | null;
  locations: Array<{
    country: string;
    address: string;
    phone?: string | null;
    email?: string | null;
  }>;
};
