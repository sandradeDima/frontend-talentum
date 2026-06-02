type SurveyScaleQuestionProps = {
  questionNumber?: number;
  helperText?: string;
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
  questionNumber,
  helperText,
  prompt,
  value,
  min = 1,
  max,
  leftLabel,
  rightLabel,
  disabled = false,
  onChange
}: SurveyScaleQuestionProps) {
  const scores = Array.from({ length: max - min + 1 }, (_, index) => min + index);
  const isCompactScale = scores.length <= 5;
  const hasQuestionNumber = typeof questionNumber === 'number';
  const mobileColumns =
    scores.length >= 10
      ? 'grid-cols-5'
      : scores.length === 4
        ? 'grid-cols-4'
        : scores.length === 3
          ? 'grid-cols-3'
          : scores.length === 2
            ? 'grid-cols-2'
            : 'grid-cols-5';

  return (
    <article className="rounded-[1.85rem] border border-white/10 bg-white/[0.035] px-3.5 py-4 text-cooltura-light shadow-[0_18px_44px_rgba(0,0,0,0.16)] sm:px-5 sm:py-6">
      <div className="flex items-start gap-3 sm:gap-4">
        {hasQuestionNumber ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cooltura-lime/80 text-sm font-semibold text-cooltura-lime sm:h-11 sm:w-11">
            {questionNumber}
          </div>
        ) : null}

        <div className="min-w-0 space-y-2">
          {helperText ? (
            <p className="text-left text-sm leading-6 text-cooltura-light/78 sm:text-[0.95rem]">
              {helperText}
            </p>
          ) : null}

          <h2 className="text-left text-[0.98rem] font-semibold leading-7 text-cooltura-light sm:text-[1.08rem] sm:leading-8">
            {prompt}
          </h2>
        </div>
      </div>

      <div className={hasQuestionNumber ? 'mt-4 sm:ml-[3.75rem]' : 'mt-5'}>
        <div className="space-y-3">
          <span className="block text-left text-[0.72rem] font-medium leading-5 text-cooltura-light/72 sm:hidden">
            {leftLabel}
          </span>

          <div className="grid gap-3 sm:hidden">
            <div
              role="radiogroup"
              aria-label={prompt}
              className={`grid ${mobileColumns} gap-x-2 gap-y-3`}
            >
              {scores.map((score) => {
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
                    className="inline-flex min-w-0 flex-col items-center gap-1.5 rounded-[0.9rem] bg-transparent px-0.5 py-1 text-cooltura-light transition hover:text-cooltura-lime focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cooltura-lime disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span
                      className={`text-[0.74rem] font-semibold leading-none ${
                        selected ? 'text-cooltura-lime' : 'text-cooltura-light/72'
                      }`}
                    >
                      {score}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${
                        selected
                          ? 'border-cooltura-lime bg-cooltura-lime/10'
                          : 'border-cooltura-gray/65 bg-cooltura-gray/10'
                      }`}
                    >
                      <span
                        className={`rounded-full transition ${
                          selected ? 'h-2.5 w-2.5 bg-cooltura-lime' : 'h-0 w-0'
                        }`}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <span className="block text-right text-[0.72rem] font-medium leading-5 text-cooltura-light/72 sm:hidden">
            {rightLabel}
          </span>

          <div className="hidden sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end sm:gap-x-4">
            <span className="text-right text-xs font-medium leading-5 text-cooltura-light/72">
              {leftLabel}
            </span>

            <div
              role="radiogroup"
              aria-label={prompt}
              className={`flex flex-nowrap items-start justify-center ${
                isCompactScale ? 'gap-4' : 'gap-3'
              }`}
            >
              {scores.map((score, index) => {
                const selected = value === score;
                const hasConnector = index < scores.length - 1;

                return (
                  <div key={score} className="flex items-start">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={`${prompt}: ${score}`}
                      disabled={disabled}
                      onClick={() => onChange(score)}
                      className="relative z-10 inline-flex min-w-[2.2rem] flex-none flex-col items-center gap-1.5 rounded-[0.9rem] bg-transparent px-0.5 py-1 text-cooltura-light transition hover:text-cooltura-lime focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cooltura-lime disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span
                        className={`text-xs font-semibold leading-none ${
                          selected ? 'text-cooltura-lime' : 'text-cooltura-light/72'
                        }`}
                      >
                        {score}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`flex items-center justify-center rounded-full border transition ${
                          selected
                            ? 'border-cooltura-lime bg-cooltura-lime/10'
                            : 'border-cooltura-gray/65 bg-cooltura-gray/10'
                        } ${isCompactScale ? 'h-6 w-6' : 'h-5 w-5'}`}
                      >
                        <span
                          className={`rounded-full transition ${
                            selected ? 'h-3 w-3 bg-cooltura-lime' : 'h-0 w-0'
                          }`}
                        />
                      </span>
                    </button>

                    {hasConnector ? (
                      <span
                        aria-hidden="true"
                        className={`mt-[1.72rem] block h-px rounded-full bg-cooltura-light/52 ${
                          isCompactScale ? 'w-5' : 'w-4'
                        }`}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>

            <span className="text-left text-xs font-medium leading-5 text-cooltura-light/72">
              {rightLabel}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
