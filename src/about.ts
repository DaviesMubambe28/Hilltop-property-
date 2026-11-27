import { config } from './config';
import { supabase } from './supabase';
import { safeText } from './validation';

const agentGrid = document.querySelector<HTMLElement>('#about-agent-grid');
const officeGrid = document.querySelector<HTMLElement>('#about-office-grid');

function unavailable(target: HTMLElement | null, message: string) {
  if (target) target.innerHTML = `<div class="about-data-state"><h3>Contact Hilltop directly</h3><p>${safeText(message)}</p><a class="text-link" href="/contact.html">Contact our team →</a></div>`;
}

async function loadAboutData() {
  if (!config || !supabase) {
    unavailable(agentGrid, 'Published team profiles are available when the website is connected to Hilltop services.');
    unavailable(officeGrid, 'Please use the contact page for current office information.');
    return;
  }
  const client = supabase;
  const [agents, branches] = await Promise.all([
    client.from('agents').select('id,name,title,bio,photo_path,email,phone,branch:branches(name)').eq('is_published', true).not('profile_id', 'is', null).order('name'),
    client.from('branches').select('id,name,email,phone,address,is_active').eq('is_active', true).order('name'),
  ]);
  if (agents.error) unavailable(agentGrid, 'Published team profiles are temporarily unavailable.');
  else if (agentGrid) agentGrid.innerHTML = agents.data.length ? agents.data.map(agent => {
    const photo = agent.photo_path ? client.storage.from('property-media').getPublicUrl(agent.photo_path).data.publicUrl : '';
    return `<article class="about-agent-card">${photo ? `<img src="${safeText(photo)}" alt="Portrait of ${safeText(agent.name)}" loading="lazy"/>` : `<div class="about-agent-placeholder" aria-hidden="true">${safeText(agent.name.slice(0, 1))}</div>`}<div><p class="eyebrow">${safeText((agent.branch as { name?: string } | null)?.name ?? 'Hilltop Properties')}</p><h3>${safeText(agent.name)}</h3><p><b>${safeText(agent.title ?? 'Property agent')}</b></p>${agent.bio ? `<p>${safeText(agent.bio)}</p>` : ''}<p class="about-agent-contact">${agent.phone ? `<a href="tel:${safeText(agent.phone.replace(/[^+\d]/g, ''))}">${safeText(agent.phone)}</a>` : ''}${agent.email ? `<a href="mailto:${safeText(agent.email)}">Email agent</a>` : ''}</p></div></article>`;
  }).join('') : '<p class="about-data-state">No agent profiles have been approved for publication yet. <a href="/contact.html">Contact Hilltop directly.</a></p>';
  if (branches.error) unavailable(officeGrid, 'Current office information is temporarily unavailable.');
  else if (officeGrid) officeGrid.innerHTML = branches.data.length ? branches.data.map(branch => `<article class="about-office-card"><p class="eyebrow">Hilltop office</p><h3>${safeText(branch.name)}</h3>${branch.address ? `<p>${safeText(branch.address)}</p>` : '<p>Contact the team for current visiting information.</p>'}<div>${branch.phone ? `<a href="tel:${safeText(branch.phone.replace(/[^+\d]/g, ''))}">${safeText(branch.phone)}</a>` : ''}${branch.email ? `<a href="mailto:${safeText(branch.email)}">${safeText(branch.email)}</a>` : ''}</div></article>`).join('') : '<p class="about-data-state">Use the contact page for current office information.</p>';
}

void loadAboutData();
