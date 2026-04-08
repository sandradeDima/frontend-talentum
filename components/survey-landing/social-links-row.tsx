import type { ComponentProps, ReactElement } from 'react';
import type { CompanyBranding } from '@/types/survey-branding';

type SocialLinksRowProps = {
  socialLinks: CompanyBranding['socialLinks'];
};

type SocialNetworkKey = keyof CompanyBranding['socialLinks'];

type SocialNetworkConfig = {
  key: SocialNetworkKey;
  label: string;
  backgroundClassName: string;
  icon: (props: ComponentProps<'svg'>) => ReactElement;
};

function LinkedInIcon(props: ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6.94 8.5H3.56V20h3.38V8.5Zm.24-3.56c0-1.08-.8-1.94-1.93-1.94s-1.94.86-1.94 1.94c0 1.07.81 1.93 1.91 1.93h.03c1.14 0 1.93-.86 1.93-1.93ZM20.44 13.15c0-3.48-1.85-5.1-4.33-5.1-2 0-2.9 1.1-3.4 1.88V8.5H9.33c.05.95 0 11.5 0 11.5h3.38v-6.42c0-.34.03-.68.13-.92.27-.68.88-1.39 1.92-1.39 1.36 0 1.9 1.05 1.9 2.58V20H20V13.15h.44Z" />
    </svg>
  );
}

function YouTubeIcon(props: ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M21.57 7.2a2.97 2.97 0 0 0-2.09-2.1C17.65 4.6 12 4.6 12 4.6s-5.64 0-7.48.5A2.97 2.97 0 0 0 2.43 7.2C1.94 9.05 1.94 12 1.94 12s0 2.95.49 4.8a2.97 2.97 0 0 0 2.1 2.1c1.83.5 7.47.5 7.47.5s5.65 0 7.48-.5a2.97 2.97 0 0 0 2.09-2.1c.49-1.85.49-4.8.49-4.8s0-2.95-.49-4.8ZM9.96 15.07V8.93L15.36 12l-5.4 3.07Z" />
    </svg>
  );
}

function InstagramIcon(props: ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon(props: ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.5 21v-8.06h2.72l.41-3.15H13.5V7.77c0-.91.25-1.53 1.56-1.53h1.67V3.43c-.8-.09-1.62-.14-2.42-.13-2.39 0-4.02 1.46-4.02 4.14v2.35H7.56v3.15h2.73V21h3.21Z" />
    </svg>
  );
}

function TiktokIcon(props: ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M14.57 3h2.61c.23 1.93 1.34 3.18 3.08 3.28v2.72a5.72 5.72 0 0 1-3.02-.86v6.28c0 3.15-1.87 5.58-5.6 5.58-3.02 0-5.4-2.03-5.4-5.16 0-3.34 2.62-5.28 5.64-5.14v2.75c-1.36-.17-2.8.51-2.8 2.1 0 1.26.97 2.08 2.18 2.08 1.35 0 2.31-.84 2.31-2.67V3Z" />
    </svg>
  );
}

function SpotifyIcon(props: ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19Zm4.37 13.71a.75.75 0 0 1-1.03.25c-2.82-1.72-6.36-2.11-10.53-1.16a.75.75 0 1 1-.33-1.46c4.56-1.04 8.47-.59 11.65 1.35.35.21.46.67.24 1.02Zm1.48-3.3a.94.94 0 0 1-1.28.3c-3.22-1.98-8.13-2.55-11.94-1.4a.94.94 0 0 1-.54-1.8c4.35-1.32 9.75-.68 13.47 1.61.44.27.58.85.29 1.29Zm.13-3.43C14.14 7.2 7.77 6.96 4.1 8.1a1.13 1.13 0 1 1-.66-2.16c4.22-1.28 11.24-1.03 15.72 1.66a1.13 1.13 0 1 1-1.18 1.88Z" />
    </svg>
  );
}

const SOCIAL_NETWORKS: SocialNetworkConfig[] = [
  {
    key: 'linkedin',
    label: 'LinkedIn',
    backgroundClassName: 'bg-[#0a66c2]',
    icon: LinkedInIcon
  },
  {
    key: 'youtube',
    label: 'YouTube',
    backgroundClassName: 'bg-[#ff3131]',
    icon: YouTubeIcon
  },
  {
    key: 'instagram',
    label: 'Instagram',
    backgroundClassName: 'bg-[#ff4f81]',
    icon: InstagramIcon
  },
  {
    key: 'facebook',
    label: 'Facebook',
    backgroundClassName: 'bg-[#2c62ff]',
    icon: FacebookIcon
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    backgroundClassName: 'bg-[#0f0f10]',
    icon: TiktokIcon
  },
  {
    key: 'spotify',
    label: 'Spotify',
    backgroundClassName: 'bg-[#1db954]',
    icon: SpotifyIcon
  }
];

export function SocialLinksRow({ socialLinks }: SocialLinksRowProps) {
  const visibleLinks = SOCIAL_NETWORKS.filter((network) => Boolean(socialLinks[network.key]));

  if (visibleLinks.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visibleLinks.map((network) => {
        const Icon = network.icon;
        const href = socialLinks[network.key];

        if (!href) {
          return null;
        }

        return (
          <a
            key={network.key}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={network.label}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-white transition duration-200 hover:-translate-y-[2px] hover:brightness-110 ${network.backgroundClassName}`}
          >
            <Icon className="h-[18px] w-[18px]" />
          </a>
        );
      })}
    </div>
  );
}
