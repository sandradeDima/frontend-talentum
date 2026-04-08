import { RespondentSurveyEntry } from '@/components/respondent-survey-entry';
import { getSurveyBrandingServer } from '@/services/survey-branding.server';

type PublicSurveyEntryPageProps = {
  params: Promise<{ campaignSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const pickFirstValue = (value: string | string[] | undefined): string | null => {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return null;
};

export default async function PublicSurveyEntryPage({
  params,
  searchParams
}: PublicSurveyEntryPageProps) {
  const { campaignSlug } = await params;
  const query = await searchParams;
  const initialToken = pickFirstValue(query.token);
  const branding = await getSurveyBrandingServer(campaignSlug);

  return (
    <RespondentSurveyEntry
      branding={branding}
      campaignSlug={campaignSlug}
      initialToken={initialToken}
      entryMode="magic-link"
    />
  );
}
