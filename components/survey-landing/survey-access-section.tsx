import type { ReactNode } from 'react';

type SurveyAccessSectionProps = {
  children: ReactNode;
};

export function SurveyAccessSection({
  children
}: SurveyAccessSectionProps) {
  return (
    <section className="bg-cooltura-panel px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-[760px] text-center">
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
