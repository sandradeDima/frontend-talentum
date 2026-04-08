type SurveyScaleQuestionProps = {
  prompt: string;
  value: number | undefined;
  min?: number;
  max: number;
  leftLabel: string;
  rightLabel: string;
  disabled?: boolean;
  onChange: (value: number) => void;
};

export function SurveyScaleQuestion({
  prompt,
  value,
  min = 1,
  max,
  leftLabel,
  rightLabel,
  disabled = false,
  onChange
}: SurveyScaleQuestionProps) {
  return (
    <article className="space-y-5 text-center text-cooltura-light">
      <h2 className="mx-auto max-w-[840px] text-xl leading-8 sm:text-[1.08rem] sm:leading-9">
        {prompt}
      </h2>

      <div className="mx-auto max-w-[700px] space-y-4">
        <div className="flex items-center justify-between gap-4 text-xs text-cooltura-light/78 sm:text-sm">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>

        <div
          role="radiogroup"
          aria-label={prompt}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
        >
          {Array.from({ length: max - min + 1 }, (_, index) => min + index).map((score) => {
            const selected = value === score;

            return (
              <button
                key={score}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`${prompt}: ${score}`}
                disabled={disabled}
                onClick={() => onChange(score)}
                className={`inline-flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cooltura-lime sm:h-12 sm:w-12 ${
                  selected
                    ? 'border-cooltura-lime bg-cooltura-lime text-cooltura-dark'
                    : 'border-cooltura-lime text-cooltura-light hover:bg-cooltura-lime/12'
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {score}
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
}
