import { requestApiClient } from '@/lib/api-client-browser';
import type { CompanyRow, CreateCompanyInput, UpdateCompanyInput } from '@/types/company';

export const createCompanyClient = async (input: CreateCompanyInput) => {
  return requestApiClient<{ company: CompanyRow }>(
    '/companies',
    {
      method: 'POST',
      body: JSON.stringify(input)
    }
  );
};

export const updateCompanyClient = async (
  companyId: string,
  input: UpdateCompanyInput
) => {
  return requestApiClient<CompanyRow>(`/companies/${companyId}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  });
};

export const updateCompanyBySlugClient = async (
  companySlug: string,
  input: UpdateCompanyInput
) => {
  return requestApiClient<CompanyRow>(
    `/companies/by-slug/${encodeURIComponent(companySlug)}`,
    {
      method: 'PUT',
      body: JSON.stringify(input)
    }
  );
};

export const getCompanySlugSuggestionsClient = async (input: {
  slug: string;
  excludeSlug?: string;
}) => {
  const query = new URLSearchParams({ slug: input.slug });

  if (input.excludeSlug) {
    query.set('excludeSlug', input.excludeSlug);
  }

  return requestApiClient<{ slug: string; suggestions: string[] }>(
    `/companies/slug-suggestions?${query.toString()}`
  );
};
