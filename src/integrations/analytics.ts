import { config } from '../config';

declare global { interface Window { dataLayer: unknown[]; gtag?: (...args: unknown[]) => void } }

function consent(): 'granted' | 'denied' | null {
  return document.cookie.match(/(?:^|; )hilltop_analytics=(granted|denied)/)?.[1] as 'granted' | 'denied' | undefined ?? null;
}

function loadAnalytics() {
  if (!config?.VITE_GA_MEASUREMENT_ID || consent() !== 'granted') return;
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = (...args: unknown[]) => window.dataLayer.push(args);
  window.gtag('js', new Date());
  window.gtag('config', config.VITE_GA_MEASUREMENT_ID, { anonymize_ip: true });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.VITE_GA_MEASUREMENT_ID)}`;
  document.head.append(script);
}

export function track(name: string, parameters: Record<string, string | number | boolean> = {}) {
  window.gtag?.('event', name, parameters);
}

export function initializeAnalytics() {
  if (!config?.VITE_GA_MEASUREMENT_ID) return;
  if (consent()) { loadAnalytics(); return; }
  const banner = document.createElement('aside');
  banner.className = 'consent-banner';
  banner.setAttribute('aria-label', 'Analytics preferences');
  banner.innerHTML = '<p>We use optional analytics to improve property searches. No enquiry content is collected.</p><div><button data-consent="denied">Decline</button><button class="button button-yellow" data-consent="granted">Allow analytics</button></div>';
  banner.addEventListener('click', (event) => {
    const choice = (event.target as HTMLElement).closest<HTMLElement>('[data-consent]')?.dataset.consent;
    if (!choice) return;
    document.cookie = `hilltop_analytics=${choice}; Max-Age=31536000; Path=/; SameSite=Lax; Secure`;
    banner.remove();
    if (choice === 'granted') loadAnalytics();
  });
  document.body.append(banner);
}
