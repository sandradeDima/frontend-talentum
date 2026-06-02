import { notFound } from 'next/navigation';
import { TestSurveyPreview } from '@/components/test-survey-preview';
import { resolveSurveyPreviewStage } from '@/lib/test-survey-preview';

type TestSurveyPreviewPageProps = {
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

export default async function TestSurveyPreviewPage({
  searchParams
}: TestSurveyPreviewPageProps) {
  const isTestSurveyPreviewEnabled =
    process.env.ENABLE_TEST_SURVEY_PREVIEW === 'true';

  if (process.env.NODE_ENV === 'production' && !isTestSurveyPreviewEnabled) {
    notFound();
  }

  const query = await searchParams;
  const initialStage = resolveSurveyPreviewStage(pickFirstValue(query.stage));

  return <TestSurveyPreview initialStage={initialStage} />;
}
