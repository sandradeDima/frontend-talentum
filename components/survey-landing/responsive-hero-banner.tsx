import Image from 'next/image';
import bannerDesktop from '@/public/assets/images/banner/banner_1920x700px.jpg';
import bannerMobile from '@/public/assets/images/banner/banner_1080x800.jpg';

export function ResponsiveHeroBanner() {
  return (
    <section aria-label="Banner de COOLtura" className="border-b border-white/15 bg-black">
      <div className="mx-auto max-w-[1600px]">
        <div className="md:hidden">
          <Image
            src={bannerMobile}
            alt="Tu opinión fortalece nuestra cultura"
            priority
            sizes="100vw"
            className="h-auto w-full object-cover"
          />
        </div>
        <div className="hidden md:block">
          <Image
            src={bannerDesktop}
            alt="Tu opinión fortalece nuestra cultura"
            priority
            sizes="100vw"
            className="h-auto w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
