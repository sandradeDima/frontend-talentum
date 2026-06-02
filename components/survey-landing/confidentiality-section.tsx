import Image from 'next/image';
import handIllustration from '@/public/assets/images/hand.png';
import lightbulbIllustration from '@/public/assets/images/lightbulb.png';

export function ConfidentialitySection() {
  return (
    <section className="overflow-hidden border-b border-white/20 bg-cooltura-panel px-4 pb-14 pt-4 sm:px-6 sm:pb-16 lg:px-8 lg:pb-20">
      <div className="relative mx-auto flex max-w-[1120px] items-center justify-center">
        <Image
          src={handIllustration}
          alt=""
          width={74}
          height={74}
          className="absolute left-0 top-1/2 hidden h-auto w-[64px] -translate-y-1/2 opacity-90 md:block lg:left-6"
        />
        <div className="max-w-[720px] px-1 text-center">
          <h2 className="text-balance text-[clamp(1.7rem,7vw,2.25rem)] font-bold leading-[1.15] text-cooltura-lime sm:text-[28px] sm:leading-[35px]">
            Tus respuestas son anónimas y confidenciales.
          </h2>
          <p className="mt-4 text-balance text-[0.95rem] leading-6 text-cooltura-light/84 sm:mt-5 sm:text-base sm:leading-7">
            En COOLtura, la privacidad es primordial. Tus respuestas se mantienen anónimas y
            confidenciales, asegurando un entorno seguro para compartir tus opiniones.
          </p>
        </div>
        <Image
          src={lightbulbIllustration}
          alt=""
          width={74}
          height={74}
          className="absolute right-0 top-1/2 hidden h-auto w-[64px] -translate-y-1/2 opacity-90 md:block lg:right-6"
        />
      </div>
    </section>
  );
}
