export type CompanyStatus = 'PENDING_SETUP' | 'ACTIVE' | 'INACTIVE';

export type CompanyRow = {
  id: string;
  name: string;
  slug: string;
  workerCount: number;
  contactEmail: string;
  supportWhatsappPhone: string | null;
  status: CompanyStatus;
  createdAt: string;
  logoUrl: string | null;
};

export type CompanyListData = {
  rows: CompanyRow[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type CreateCompanyInput = {
  name: string;
  slug: string;
  workerCount: number;
  contactEmail: string;
  logoUrl?: string;
  supportWhatsappPhone?: string;
};

export type UpdateCompanyInput = {
  name?: string;
  slug?: string;
  workerCount?: number;
  contactEmail?: string;
  logoUrl?: string | null;
  supportWhatsappPhone?: string | null;
  status?: CompanyStatus;
};
