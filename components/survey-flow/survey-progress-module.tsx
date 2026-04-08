type SurveyProgressModuleProps = {
  progressPercent: number;
  label: string;
  currentStep: number;
  totalSteps: number;
};

export function SurveyProgressModule({
  progressPercent,
  label,
  currentStep,
  totalSteps
}: SurveyProgressModuleProps) {
  return (
    <div className="mx-auto w-full max-w-[380px] text-left text-cooltura-light">
      <p className="text-[0.6rem] uppercase tracking-[0.18em] text-cooltura-light/55">
        Has completado
      </p>
      <div className="mt-1 flex items-end justify-between gap-4">
        <p className="text-lg leading-none text-cooltura-light sm:text-[1.65rem]">
          <span className="text-cooltura-lime">{progressPercent}%</span>{' '}
          <span>{label}</span>
        </p>
        <span className="whitespace-nowrap text-[0.6rem] uppercase tracking-[0.16em] text-cooltura-light/45">
          Paso {currentStep} de {totalSteps}
        </span>
      </div>

      <div className="relative mt-4 h-4">
        <div className="absolute inset-x-0 top-1/2 h-[10px] -translate-y-1/2 rounded-full bg-white/92" />
        <div
          className="absolute left-0 top-1/2 h-[10px] -translate-y-1/2 rounded-full bg-cooltura-lime transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
        <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between">
          {Array.from({ length: Math.max(totalSteps - 1, 0) }, (_, index) => (
            <span
              key={index}
              className="h-[3px] w-[3px] rounded-full bg-cooltura-lime/95 shadow-[0_0_0_2px_rgba(255,255,255,0.92)]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
