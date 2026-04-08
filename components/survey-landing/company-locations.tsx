import Image from 'next/image';
import locationIcon from '@/public/assets/images/footer/localizacion (1).png';
import whatsappIcon from '@/public/assets/images/footer/whatsapp.png';
import emailIcon from '@/public/assets/images/footer/email.png';
import type { CompanyBranding } from '@/types/survey-branding';

type CompanyLocationsProps = {
  locations: CompanyBranding['locations'];
};

export function CompanyLocations({ locations }: CompanyLocationsProps) {
  if (locations.length === 0) {
    return (
      <p className="max-w-sm text-sm leading-6 text-cooltura-light/75">
        La información de contacto corporativa se mostrará aquí cuando esté disponible.
      </p>
    );
  }

  return (
    <div className="grid gap-10 md:grid-cols-2">
      {locations.map((location) => (
        <section key={location.country} className="space-y-5">
          <h3 className="font-coolturaDisplay text-[1.7rem] uppercase tracking-[0.04em] text-cooltura-light">
            {location.country}
          </h3>
          <div className="space-y-4 text-sm leading-6 text-cooltura-light/88">
            {location.address ? (
              <div className="flex items-start gap-3">
                <Image
                  src={locationIcon}
                  alt=""
                  width={18}
                  height={18}
                  className="mt-1 h-[18px] w-[18px] shrink-0"
                />
                <p>{location.address}</p>
              </div>
            ) : null}
            {location.phone ? (
              <div className="flex items-start gap-3">
                <Image
                  src={whatsappIcon}
                  alt=""
                  width={18}
                  height={18}
                  className="mt-1 h-[18px] w-[18px] shrink-0"
                />
                <p>{location.phone}</p>
              </div>
            ) : null}
            {location.email ? (
              <div className="flex items-start gap-3">
                <Image
                  src={emailIcon}
                  alt=""
                  width={18}
                  height={18}
                  className="mt-1 h-[18px] w-[18px] shrink-0"
                />
                <a
                  href={`mailto:${location.email}`}
                  className="text-cooltura-lime transition hover:text-cooltura-light"
                >
                  {location.email}
                </a>
              </div>
            ) : null}
          </div>
        </section>
      ))}
    </div>
  );
}
