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
        <div className="max-w-[720px] text-center">
          <h2 className="text-nowrap text-[28px] font-bold leading-[35px] text-cooltura-lime">
            Tus respuestas son anónimas y confidenciales.
          </h2>
          <p className="mt-5 text-balance text-sm leading-7 text-cooltura-light/84 sm:text-base">
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
