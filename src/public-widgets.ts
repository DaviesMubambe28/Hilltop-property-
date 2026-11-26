import { config } from './config';
import { supabase } from './supabase';
import { currentProfile } from './services/auth';

export function whatsappUrl(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function searchUrl(message: string): string {
  const text = message.toLowerCase();
  const params = new URLSearchParams();
  params.set('listing', text.includes('rent') ? 'rent' : text.includes('invest') ? 'investment' : 'sale');
  const location = ['lusaka', 'livingstone', 'chongwe'].find((place) => text.includes(place));
  if (location) params.set('q', location);
  const bedrooms = text.match(/(\d{1,2})\s*(?:bed|bedroom)/)?.[1];
  if (bedrooms) params.set('bedrooms', bedrooms);
  const budget = text.match(/(?:k|zmw)\s*([\d,.]+)/i)?.[1]?.replace(/[,]/g, '');
  if (budget && Number.isFinite(Number(budget))) params.set('maxPrice', budget);
  return `/properties.html?${params}`;
}

export function installPublicWidgets(): void {
  if (document.querySelector('.floating-support')) return;
  const support = document.createElement('div');
  support.className = 'floating-support';

  const assistant = document.createElement('section');
  assistant.className = 'property-assistant';
  assistant.hidden = true;
  assistant.setAttribute('aria-label', 'Hilltop Property Assistant');
  assistant.innerHTML = `<header><div><b>Hilltop Property Assistant</b><small>Property guidance and live search</small></div><button type="button" data-chat-close aria-label="Close property assistant">×</button></header><div class="assistant-conversation" role="log" aria-live="polite"><p class="assistant-message">Welcome to Hilltop Properties Zambia! I’m your Hilltop Property Assistant. How can I help you with your next property journey?</p><div class="assistant-actions"><a href="/properties.html?listing=sale">Find a property</a><a href="/properties.html?listing=rent">Find a rental</a><a href="/properties.html?q=land">Buy land</a><a href="/properties.html?listing=investment">Explore investments</a><a href="/sell.html">Sell my property</a><a href="/contact.html?type=viewing">Request a viewing</a><a href="/contact.html">Contact an agent</a></div></div><form class="assistant-form"><label class="sr-only" for="assistant-message">Ask about a property</label><input id="assistant-message" name="message" maxlength="300" placeholder="e.g. 3 bedrooms in Lusaka under K3000000" required/><button type="submit">Search</button></form>`;

  const launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'assistant-launcher';
  launcher.setAttribute('aria-label', 'Chat: open Hilltop Property Assistant');
  launcher.setAttribute('aria-expanded', 'false');
  launcher.textContent = 'Chat';

  launcher.addEventListener('click', () => {
    assistant.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    assistant.querySelector<HTMLInputElement>('input')?.focus();
  });
  assistant.querySelector('[data-chat-close]')?.addEventListener('click', () => {
    assistant.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  });
  assistant.querySelector<HTMLFormElement>('form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = assistant.querySelector<HTMLInputElement>('input');
    if (!input?.value.trim()) return;
    location.href = searchUrl(input.value.trim());
  });

  support.append(assistant, launcher);
  if (config?.VITE_WHATSAPP_NUMBER) {
    const propertyTitle = document.querySelector('h1')?.textContent?.trim();
    const propertyReference = document.querySelector<HTMLElement>('[data-property-reference]')?.dataset.propertyReference;
    const message = location.pathname.startsWith('/property') && propertyTitle
      ? `Hello Hilltop Properties Zambia. I am interested in ${propertyTitle}${propertyReference ? ` (${propertyReference})` : ''}. ${location.href}`
      : 'Hello Hilltop Properties Zambia. I would like assistance finding a property.';
    const whatsapp = document.createElement('a');
    whatsapp.className = 'whatsapp-float';
    whatsapp.href = whatsappUrl(config.VITE_WHATSAPP_NUMBER, message);
    whatsapp.target = '_blank';
    whatsapp.rel = 'noopener';
    whatsapp.setAttribute('aria-label', 'Chat with Hilltop on WhatsApp');
    whatsapp.dataset.tooltip = 'Chat with Hilltop on WhatsApp';
    whatsapp.innerHTML = '<svg aria-hidden="true" viewBox="0 0 32 32" width="27" height="27" fill="currentColor"><path d="M16 3a12 12 0 0 0-10.3 18.2L4 28l7-1.6A12 12 0 1 0 16 3Zm0 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-4.1 1 1.1-4-.3-.4A9.7 9.7 0 1 1 16 24.8Zm5.3-7.2c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.7.2-.2.3-.8.9-1 1.1-.2.2-.4.2-.7.1-1.9-.9-3.2-1.7-4.5-3.9-.3-.6.3-.6.9-1.4.1-.2.1-.4 0-.6l-.9-2.1c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.3 1.4 3.6c.2.2 2.4 3.7 5.9 5.2.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.4-.2-.7-.3Z"/></svg>';
    support.append(whatsapp);
  }
  document.body.append(support);
}

async function updateAccountLinks() {
  const profile=supabase?await currentProfile().catch(()=>null):null;
  document.querySelectorAll<HTMLAnchorElement>('a[href="/account.html"]').forEach((link)=>{
    if(profile){if(/account|saved/i.test(link.textContent??''))link.textContent='My account';return;}
    link.href=`/sign-in.html?returnTo=${encodeURIComponent(location.pathname+location.search)}`;
    if(/account|saved/i.test(link.textContent??''))link.textContent='Sign in';
  });
}

if (typeof document !== 'undefined'){installPublicWidgets();void updateAccountLinks();}
