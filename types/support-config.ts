export type PublicSupportConfigData = {
  config: {
    scopeType: 'GLOBAL' | 'COMPANY';
    company: {
      id: string;
      slug: string;
      name: string;
    } | null;
    whatsappLink: string | null;
    supportEmail: string | null;
    helpCenterUrl: string | null;
  } | null;
};
