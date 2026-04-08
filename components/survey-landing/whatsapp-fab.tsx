import Image from 'next/image';
import whatsappIcon from '@/public/assets/images/footer/whatsapp.png';

type WhatsAppFabProps = {
  phone: string | null | undefined;
};

const buildWhatsAppHref = (rawPhone: string | null | undefined): string | null => {
  if (!rawPhone) {
    return null;
  }

  const normalizedDigits = rawPhone.replace(/\D+/g, '');
  if (normalizedDigits.length < 7) {
    return null;
  }

  return `https://wa.me/${normalizedDigits}`;
};

export function WhatsAppFab({ phone }: WhatsAppFabProps) {
  const href = buildWhatsAppHref(phone);

  if (!href) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-5 z-30 inline-flex h-[74px] w-[74px] items-center justify-center rounded-full bg-[#25d366] shadow-[0_18px_35px_rgba(0,0,0,0.34)] transition duration-200 hover:scale-[1.03] hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cooltura-lime"
    >
      <Image
        src={whatsappIcon}
        alt=""
        width={34}
        height={34}
        className="h-[34px] w-[34px] object-contain brightness-0 invert"
      />
    </a>
  );
}
