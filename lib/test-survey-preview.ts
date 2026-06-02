import type { ValidateSurveyAccessResult } from '@/types/respondent-survey';
import type { CompanyBranding } from '@/types/survey-branding';

export type SurveyPreviewStage = 'access' | 'intro' | 'survey' | 'submitted';

const PREVIEW_STAGES: SurveyPreviewStage[] = ['access', 'intro', 'survey', 'submitted'];

export const resolveSurveyPreviewStage = (value: string | null | undefined): SurveyPreviewStage => {
  if (value && PREVIEW_STAGES.includes(value as SurveyPreviewStage)) {
    return value as SurveyPreviewStage;
  }

  return 'survey';
};

export const testSurveyPreviewBranding: CompanyBranding = {
  companyName: 'Talentum Preview Labs',
  topRightLogoUrl: null,
  socialLinks: {
    linkedin: 'https://www.linkedin.com',
    instagram: 'https://www.instagram.com',
    youtube: 'https://www.youtube.com'
  },
  supportWhatsappPhone: '59170000000',
  locations: [
    {
      country: 'Bolivia',
      address: 'Av. Ejemplo 123, La Paz',
      phone: '+591 2 2000000',
      email: 'preview@talentum.local'
    }
  ]
};

export const testSurveyPreviewAccessContext: ValidateSurveyAccessResult = {
  sessionToken: 'preview-session-token',
  sessionExpiresAt: '2026-12-31T23:59:59.000Z',
  campaign: {
    id: 'preview-campaign-id',
    slug: 'test-preview',
    name: 'Encuesta de vista previa',
    status: 'EN_PROCESO',
    startDate: '2026-06-01T00:00:00.000Z',
    endDate: '2026-06-30T23:59:59.000Z',
    tutorialVideoUrl: null,
    content: {
      introGeneral:
        'Esta es una version de prueba para revisar cambios de interfaz y texto sin depender de una empresa real.',
      leaderIntro:
        'Piensa en como tus lideres orientan, escuchan y toman decisiones en el dia a dia.',
      leaderQuestions: [
        'Mi lider comunica con claridad lo que espera del equipo.',
        'Recibo apoyo de mi lider cuando surge un problema importante.',
        'Las decisiones de liderazgo son consistentes con los valores que se promueven.'
      ],
      leaderExtraQuestion: null,
      teamIntro:
        'Considera como se vive la colaboracion dentro de tu equipo de trabajo.',
      teamQuestions: [
        'En mi equipo compartimos informacion de forma oportuna.',
        'Cuando aparece un conflicto, lo resolvemos con respeto.',
        'Siento que mi equipo me permite aportar ideas con libertad.'
      ],
      teamExtraQuestion: null,
      organizationIntro:
        'Evalua como se percibe la organizacion en su conjunto, mas alla de tu equipo inmediato.',
      organizationQuestions: [
        'La organizacion actua de forma coherente con lo que comunica.',
        'Las decisiones relevantes se explican con suficiente contexto.',
        'Veo oportunidades reales para crecer y desarrollarme aqui.'
      ],
      organizationExtraQuestion: null,
      finalNpsQuestion:
        'Del 1 al 10, ¿Que tan probable es que recomiendes esta organizacion como lugar para trabajar?',
      finalOpenQuestion:
        'Si pudieras cambiar una sola cosa de la experiencia de trabajo, cual seria?',
      closingText:
        'Gracias por usar esta vista previa.\nPuedes volver cuando necesites revisar nuevos cambios de UI o contenido.\nNada de lo que hagas aqui se guarda en el backend.'
    }
  },
  respondent: {
    id: 'preview-respondent-id',
    identifier: 'preview-user',
    fullName: 'Persona de prueba'
  },
  response: {
    id: 'preview-response-id',
    status: 'IN_PROGRESS',
    startedAt: '2026-06-01T10:00:00.000Z',
    lastActivityAt: '2026-06-01T10:00:00.000Z',
    submittedAt: null,
    sessionExpiresAt: '2026-12-31T23:59:59.000Z'
  }
};

export const testSurveyPreviewClosingLines =
  testSurveyPreviewAccessContext.campaign.content.closingText
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
