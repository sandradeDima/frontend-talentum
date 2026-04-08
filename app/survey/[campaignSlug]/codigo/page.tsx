import { RespondentSurveyEntry } from '@/components/respondent-survey-entry';
import { getSurveyBrandingServer } from '@/services/survey-branding.server';

type PublicSurveyAccessCodePageProps = {
  params: Promise<{ campaignSlug: string }>;
};

export default async function PublicSurveyAccessCodePage({
  params
}: PublicSurveyAccessCodePageProps) {
  const { campaignSlug } = await params;
  const branding = await getSurveyBrandingServer(campaignSlug);

  return (
    <RespondentSurveyEntry
      branding={branding}
      campaignSlug={campaignSlug}
      entryMode="access-code"
    />
  );
}
