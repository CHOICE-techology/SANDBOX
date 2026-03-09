// Official brand logos for social platforms
import xTwitterLogo from '@/assets/logos/x-twitter.png';
import githubLogo from '@/assets/logos/github.png';
import discordLogo from '@/assets/logos/discord.png';
import telegramLogo from '@/assets/logos/telegram.png';
import linkedinLogo from '@/assets/logos/linkedin.png';
import instagramLogo from '@/assets/logos/instagram.png';
import youtubeLogo from '@/assets/logos/youtube.png';
import tiktokLogo from '@/assets/logos/tiktok.png';
import farcasterLogo from '@/assets/logos/farcaster.png';
import facebookLogo from '@/assets/logos/facebook.png';
import metaLogo from '@/assets/logos/meta.png';

export interface PlatformMeta {
  logo: string;
  /** neon accent color for glow & badge */
  color: string;
  /** tailwind bg for icon pill */
  bgClass: string;
}

export const PLATFORM_META: Record<string, PlatformMeta> = {
  X:         { logo: xTwitterLogo,   color: '#e2e8f0', bgClass: 'bg-slate-900' },
  Twitter:   { logo: xTwitterLogo,   color: '#0ea5e9', bgClass: 'bg-sky-900' },
  Linkedin:  { logo: linkedinLogo,   color: '#0ea5e9', bgClass: 'bg-blue-700' },
  LinkedIn:  { logo: linkedinLogo,   color: '#0ea5e9', bgClass: 'bg-blue-700' },
  Instagram: { logo: instagramLogo,  color: '#ec4899', bgClass: 'bg-pink-700' },
  Github:    { logo: githubLogo,     color: '#94a3b8', bgClass: 'bg-slate-700' },
  GitHub:    { logo: githubLogo,     color: '#94a3b8', bgClass: 'bg-slate-700' },
  Youtube:   { logo: youtubeLogo,    color: '#ef4444', bgClass: 'bg-red-700' },
  YouTube:   { logo: youtubeLogo,    color: '#ef4444', bgClass: 'bg-red-700' },
  TikTok:    { logo: tiktokLogo,     color: '#06b6d4', bgClass: 'bg-slate-900' },
  Telegram:  { logo: telegramLogo,   color: '#0ea5e9', bgClass: 'bg-sky-600' },
  Discord:   { logo: discordLogo,    color: '#818cf8', bgClass: 'bg-indigo-700' },
  Farcaster: { logo: farcasterLogo,  color: '#a855f7', bgClass: 'bg-purple-700' },
  Facebook:  { logo: facebookLogo,   color: '#3b82f6', bgClass: 'bg-blue-700' },
  Meta:      { logo: metaLogo,       color: '#3b82f6', bgClass: 'bg-blue-600' },
};

export const getPlatformMeta = (platform: string): PlatformMeta | null =>
  PLATFORM_META[platform] ?? null;
