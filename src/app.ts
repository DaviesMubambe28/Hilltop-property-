import { installPropertyImageFallbacks } from './property-images';
import { config } from './config';
import { supabase } from './supabase';
import { currentProfile, resetPassword, signIn, signUp } from './services/auth';
import { submitEnquiry, submitViewingRequest } from './services/enquiries';
import { imageUrl, listOptions, listProperties, recordPropertyView, savePropertySearch, toggleSaved } from './services/properties';
import type { ListingType, Property, SearchFilters } from './types';
import { safeText } from './validation';
import { initializeAnalytics, track } from './integrations/analytics';
import { parseSearchFilters, searchParamsFromFilters } from './search';
import { parseComparisonSlugs, toggleComparisonSlug } from './comparison';
import { renderPropertyMap } from './property-map';
import { renderPropertyCard } from './property-presentation';

const grid = document.querySelector<HTMLElement>('.property-grid');
const pagination = document.querySelector<HTMLElement>('.catalogue-pagination');
const propertyDialog = document.querySelector<HTMLDialogElement>('#property-dialog');
const propertyDetail = document.querySelector<HTMLElement>('#property-detail');
const authDialog = document.querySelector<HTMLDialogElement>('#auth-dialog');
const properties = new Map<string, Property>();
let authMode: 'signin' | 'signup' = 'signin';
const demoPreview = import.meta.env.DEV && new URLSearchParams(location.search).get('preview') === 'demo';

function notify(message: string) {
  const toast = document.querySelector<HTMLElement>('.toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  window.setTimeout(() => toast.classList.remove('visible'), 3000);
}

function updateComparisonLink(){const selected=parseComparisonSlugs(new URLSearchParams(location.search).get('compare'));const link=document.querySelector<HTMLAnchorElement>('#comparison-link');if(!link)return;link.hidden=!selected.length;const params=new URLSearchParams({properties:selected.join(',')});if(demoPreview)params.set('preview','demo');link.href=`/compare.html?${params}`;link.textContent=`Compare selected properties (${selected.length}/4)`;}

function filtersFromPage(): SearchFilters {
  const params = new URLSearchParams(location.search);
  const listingType = document.querySelector<HTMLButtonElement>('.search-tabs [role="tab"][aria-selected="true"]')?.dataset.listing as ListingType | undefined;
  return parseSearchFilters(params, listingType ?? 'sale');
}

function formatPrice(property: Property): string {
  if (property.price === null) return 'Price on enquiry';
  const value = new Intl.NumberFormat('en-ZM', { style: 'currency', currency: property.currency, maximumFractionDigits: 0 }).format(property.price);
  return property.price_period && property.price_period !== 'once' ? `${value} / ${property.price_period}` : value;
}

function renderActiveFilters(){document.querySelector('#active-filters')?.remove();const params=new URLSearchParams(location.search);const labels:Record<string,string>={q:'Keywords',province:'Province',type:'Property type',price:'Price',minPrice:'Minimum price',maxPrice:'Maximum price',bedrooms:'Bedrooms',bathrooms:'Bathrooms',minLandSize:'Land size',minFloorSize:'Floor size',furnished:'Furnishing',condition:'Condition',verification:'Verification',amenities:'Features',sort:'Sort'};const entries=[...params.entries()].filter(([key,value])=>labels[key]&&value);if(!entries.length)return;const container=document.createElement('div');container.id='active-filters';container.className='active-filters';container.setAttribute('aria-label','Active property filters');container.innerHTML=`<span>Active filters</span>${entries.map(([key,value])=>`<button type="button" data-remove-filter="${safeText(key)}" aria-label="Remove ${safeText(labels[key])}: ${safeText(value)}">${safeText(labels[key])}: ${safeText(value)} <b aria-hidden="true">×</b></button>`).join('')}`;document.querySelector('#catalogue-summary')?.after(container);}

function updateComparisonButtons() {
  const selected = parseComparisonSlugs(new URLSearchParams(location.search).get('compare'));
  document.querySelectorAll<HTMLElement>('[data-compare]').forEach(button => button.setAttribute('aria-pressed', String(selected.includes(button.dataset.compare!))));
}

async function updateMapView() {
  const panel = document.querySelector<HTMLElement>('#property-map-panel');
  if (!panel) return;
  const show = new URLSearchParams(location.search).get('view') === 'map';
  panel.hidden = !show;
  document.querySelectorAll<HTMLElement>('[data-result-view]').forEach(button => button.setAttribute('aria-pressed', String((button.dataset.resultView === 'map') === show)));
  if (show) {
    try { await renderPropertyMap([...properties.values()], panel); }
    catch { panel.innerHTML = '<div class="catalogue-state"><h3>Map temporarily unavailable</h3><p>You can still browse all matching properties in the list.</p><button class="button button-dark" data-result-view="grid">Return to list</button></div>'; }
  }
}

async function loadCatalogue() {
  if (!grid || !pagination) return;
  properties.clear();
  document.querySelector('#catalogue-summary')?.remove();
  pagination.replaceChildren();
  const previousMap=document.querySelector<HTMLElement>('#property-map-panel');
  if(previousMap)previousMap.hidden=true;
  if ((!config || !supabase) && !demoPreview) {
    grid.innerHTML = '<div class="catalogue-state premium-state"><p class="eyebrow">Let’s find your next move</p><h3>Property search is temporarily unavailable</h3><p>We cannot show current listings here yet. Talk to Hilltop about what you are looking for.</p><a class="button button-dark" href="/contact.html">Ask about properties →</a></div>';
    return;
  }
  grid.setAttribute('aria-busy', 'true');
  grid.innerHTML = '<p class="catalogue-state">Loading available properties…</p>';
  try {
    const filters = filtersFromPage();
    const result = demoPreview ? (await import('./demo-catalogue')).filterDemoProperties((await import('./demo-catalogue')).demoProperties,filters) : await listProperties(filters);
    properties.clear();
    result.data.forEach((property) => properties.set(property.id, property));
    const homepage = document.body.classList.contains('homepage');
    const visibleProperties = homepage ? [...result.data].sort((a,b)=>Number(b.is_featured)-Number(a.is_featured)).slice(0,3) : result.data;
    if(homepage) { const browse=document.querySelector<HTMLAnchorElement>('#properties .section-heading .text-link'); if(browse)browse.href=`/properties.html?${new URLSearchParams(location.search)}`; }
    let summary=document.querySelector<HTMLElement>('#catalogue-summary');if(!summary){summary=document.createElement('p');summary.id='catalogue-summary';summary.className='catalogue-summary';const layout=grid.closest('.catalogue-layout');(layout??grid).before(summary);}summary.innerHTML=demoPreview?`<b>${result.total} demonstration properties</b><span>Development preview — synthetic inventory, not public listings.</span>`:`<b>${result.total} available propert${result.total===1?'y':'ies'}</b>`;
    renderActiveFilters();
    grid.innerHTML = result.data.length ? visibleProperties.map(property => renderPropertyCard(property, demoPreview)).join('') : '<div class="catalogue-state"><h3>No matching properties</h3><p>Try removing one or more filters to see available properties.</p><button class="button button-dark" data-clear-search>Clear search</button></div>';
    const pages = Math.ceil(result.total / filters.pageSize);
    pagination.innerHTML = !homepage && pages > 1 ? Array.from({ length: pages }, (_, index) => `<button data-page="${index + 1}" ${index + 1 === filters.page ? 'aria-current="page"' : ''}>${index + 1}</button>`).join('') : '';
    updateComparisonButtons();
    await updateMapView();
  } catch {
    grid.innerHTML = '<div class="catalogue-state"><h3>Properties are temporarily unavailable</h3><p>We could not load the listings. Please try again or contact Hilltop for help.</p><button class="button button-dark" data-retry>Retry</button></div>';
  } finally {
    grid.removeAttribute('aria-busy');
  }
}

function openProperty(property: Property) {
  if (!propertyDialog || !propertyDetail) return;
  const images = property.images.sort((a, b) => a.position - b.position);
  const gallery = images.length ? images.map((image) => `<img src="${safeText(imageUrl(image.storage_path))}" alt="${safeText(image.alt_text)}" loading="lazy" />`).join('') : '<div class="property-placeholder">Image coming soon</div>';
  const whatsapp = config?.VITE_WHATSAPP_NUMBER ? `https://wa.me/${config.VITE_WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello Hilltop, I am interested in ${property.title} (${property.reference}).`)}` : '';
  propertyDetail.innerHTML = `<div class="property-gallery">${gallery}</div><p class="eyebrow">${safeText(property.reference)} · ${safeText(property.listing_type)}</p><h2>${safeText(property.title)}</h2><p class="detail-price">${safeText(formatPrice(property))}</p><p>${safeText(property.description || property.summary)}</p><dl class="detail-meta"><div><dt>Bedrooms</dt><dd>${property.bedrooms ?? '—'}</dd></div><div><dt>Bathrooms</dt><dd>${property.bathrooms ?? '—'}</dd></div><div><dt>Location</dt><dd>${safeText(property.location?.name ?? 'Zambia')}</dd></div></dl><div class="detail-actions"><button class="button button-yellow" data-enquire="${property.id}">Enquire now</button><button class="button button-dark" data-viewing="${property.id}">Request viewing</button>${whatsapp ? `<a class="button button-dark" href="${whatsapp}" target="_blank" rel="noopener">WhatsApp</a>` : ''}</div><div id="enquiry-slot"></div>`;
  propertyDialog.showModal();
  void recordPropertyView(property.id).catch(() => undefined);
}

function showViewing(property: Property) {
  const slot=document.querySelector<HTMLElement>('#enquiry-slot');if(!slot)return;
  const minimum=new Date(Date.now()+60*60_000);minimum.setMinutes(0,0,0);
  slot.innerHTML=`<form id="viewing-form" class="enquiry-form" data-property-id="${property.id}" data-idempotency-key="${crypto.randomUUID()}"><h3>Request a viewing</h3><label>Name<input name="name" autocomplete="name" required minlength="2" maxlength="120" /></label><label>Email<input name="email" type="email" autocomplete="email" required /></label><label>Phone<input name="phone" type="tel" autocomplete="tel" maxlength="30" /></label><label>Viewing type<select name="mode"><option value="physical">In person</option><option value="virtual">Virtual viewing</option></select></label><label>Preferred date and time<input name="preferredStart" type="datetime-local" min="${minimum.toISOString().slice(0,16)}" required /></label><label class="hp-field" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off" /></label><label class="consent"><input name="consent" type="checkbox" required /> I consent to Hilltop contacting me about this viewing.</label><button class="button button-yellow" type="submit">Request viewing</button><p role="status"></p></form>`;
}

function showEnquiry(property: Property) {
  const slot = document.querySelector<HTMLElement>('#enquiry-slot');
  if (!slot) return;
  slot.innerHTML = `<form id="enquiry-form" class="enquiry-form" data-idempotency-key="${crypto.randomUUID()}"><h3>Enquire about this property</h3><label>Name<input name="name" autocomplete="name" required minlength="2" maxlength="120" /></label><label>Email<input name="email" type="email" autocomplete="email" required /></label><label>Phone<input name="phone" type="tel" autocomplete="tel" maxlength="30" /></label><label class="hp-field" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off" /></label><label>Message<textarea name="message" required minlength="10" maxlength="4000">I would like more information about ${safeText(property.title)}.</textarea></label><label class="consent"><input name="consent" type="checkbox" required /> I consent to Hilltop contacting me about this enquiry.</label><button class="button button-yellow" type="submit">Send enquiry</button><p role="status"></p></form>`;
}

async function setupOptions() {
  if(demoPreview){const{demoProperties,demoTypeIds}=await import('./demo-catalogue');const province=document.querySelector<HTMLSelectElement>('#search-province');const type=document.querySelector<HTMLSelectElement>('#search-type');['Lusaka','Southern'].forEach((name)=>province?.insertAdjacentHTML('beforeend',`<option value="${name}">${name}</option>`));[...new Map(demoProperties.map((property)=>[property.property_type?.slug,property.property_type])).values()].filter(Boolean).forEach((item)=>type?.insertAdjacentHTML('beforeend',`<option value="${demoTypeIds[item!.slug]}">${safeText(item!.name)}</option>`));syncSearchForm();return;}
  if (!supabase) return;
  try {
    const { locations, types } = await listOptions();
    const province = document.querySelector<HTMLSelectElement>('#search-province');
    const city = document.querySelector<HTMLSelectElement>('#search-city');
    const neighbourhood = document.querySelector<HTMLSelectElement>('#search-neighbourhood');
    const type = document.querySelector<HTMLSelectElement>('#search-type');
    [...new Set((locations ?? []).map((item) => item.province).filter(Boolean))].sort().forEach((name) => province?.insertAdjacentHTML('beforeend', `<option value="${safeText(name)}">${safeText(name)}</option>`));
    (locations ?? []).filter((item) => !item.parent_id).forEach((item) => city?.insertAdjacentHTML('beforeend', `<option value="${item.id}">${safeText(item.name)}</option>`));
    const renderNeighbourhoods = () => {
      if (!neighbourhood) return;
      const selected = new URLSearchParams(location.search).get('neighbourhood') ?? '';
      neighbourhood.innerHTML = '<option value="">All neighbourhoods</option>';
      (locations ?? []).filter((item) => item.parent_id && (!city?.value || item.parent_id === city.value)).forEach((item) => neighbourhood.insertAdjacentHTML('beforeend', `<option value="${item.id}">${safeText(item.name)}</option>`));
      neighbourhood.value = selected;
    };
    city?.addEventListener('change', renderNeighbourhoods);
    types?.forEach((item) => type?.insertAdjacentHTML('beforeend', `<option value="${item.id}">${safeText(item.name)}</option>`));
    syncSearchForm();
    renderNeighbourhoods();
  } catch { notify('Search options could not be loaded.'); }
}

function syncSearchForm() {
  const params = new URLSearchParams(location.search);
  const form = document.querySelector<HTMLFormElement>('#property-search');
  if (!form) return;
  const values: Record<string, string> = {
    q: params.get('q') ?? '', price: params.get('price') ?? '', province: params.get('province') ?? '', city: params.get('city') ?? '',
    neighbourhood: params.get('neighbourhood') ?? '', propertyType: params.get('type') ?? '',
    minPrice: params.get('minPrice') ?? '', maxPrice: params.get('maxPrice') ?? '', bedrooms: params.get('bedrooms') ?? '',
    bathrooms: params.get('bathrooms') ?? '', minLandSize: params.get('minLandSize') ?? '', minFloorSize: params.get('minFloorSize') ?? '',
    furnished: params.get('furnished') ?? '', condition: params.get('condition') ?? '', verification: params.get('verification') ?? '', sort: params.get('sort') ?? 'newest',
  };
  Object.entries(values).forEach(([name, value]) => { const field = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null; if (field) field.value = value; });
  const amenities = new Set((params.get('amenities') ?? '').split(','));
  form.querySelectorAll<HTMLInputElement>('input[name="amenity"]').forEach((input) => { input.checked = amenities.has(input.value); });
  const listing = params.get('listing') ?? 'sale';
  document.querySelectorAll<HTMLButtonElement>('.search-tabs [data-listing]').forEach((button) => { const active = button.dataset.listing === listing; button.classList.toggle('active', active); button.setAttribute('aria-selected', String(active)); });
  const advancedKeys = ['city','neighbourhood','minPrice','maxPrice','bedrooms','bathrooms','minLandSize','minFloorSize','furnished','condition','verification','amenities','sort'];
  const panel = document.querySelector<HTMLElement>('#advanced-search');
  const advancedButton = document.querySelector<HTMLButtonElement>('.advanced');
  if (panel && advancedButton && !(document.querySelector('#filter-dialog') && matchMedia('(max-width:720px)').matches) && advancedKeys.some((key) => params.has(key))) { panel.hidden = false; advancedButton.setAttribute('aria-expanded', 'true'); }
}

function filtersFromForm(form: HTMLFormElement): SearchFilters {
  const data = new FormData(form);
  const params = new URLSearchParams();
  for (const [key, value] of data.entries()) if (key !== 'amenity' && String(value).trim()) params.set(key === 'propertyType' ? 'type' : key, String(value));
  const amenities = data.getAll('amenity').map(String);
  if (amenities.length) params.set('amenities', amenities.join(','));
  const listingType = document.querySelector<HTMLButtonElement>('.search-tabs [role="tab"][aria-selected="true"]')?.dataset.listing as ListingType | undefined;
  return parseSearchFilters(params, listingType ?? 'sale');
}

async function setupAccount() {
  const actions = document.querySelector('.nav-actions');
  if (!actions) return;
  const account = document.createElement('button');
  account.className = 'account-button';
  account.textContent = 'Account';
  actions.insertBefore(account, actions.querySelector('.header-cta'));
  if (!supabase) account.disabled = true;
  const profile = supabase ? await currentProfile().catch(() => null) : null;
  account.textContent = profile ? profile.profile.full_name || 'My account' : 'Sign in';
  account.addEventListener('click', async () => {
    if (profile) { location.href='/account.html'; }
    else if (authDialog) authDialog.showModal();
    else location.href = '/account.html';
  });
}

document.querySelector('#property-search')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const filters = filtersFromForm(event.currentTarget as HTMLFormElement);
  const params = searchParamsFromFilters({ ...filters, page: 1 });
  if(demoPreview)params.set('preview','demo');
  const current = new URLSearchParams(location.search);
  if (current.get('view') === 'map') params.set('view', 'map');
  if (current.get('compare')) params.set('compare', current.get('compare')!);
  history.pushState(null, '', `${location.pathname}?${params}#properties`);
  filterDialog?.close();
  syncSearchForm();
  void loadCatalogue();
});

document.querySelector('#ai-property-search')?.addEventListener('submit',async(event)=>{event.preventDefault();const form=event.currentTarget as HTMLFormElement;const prompt=String(new FormData(form).get('prompt')??'').trim();const status=form.querySelector<HTMLElement>('[role="status"]');const button=form.querySelector<HTMLButtonElement>('button');if(button)button.disabled=true;if(status)status.textContent='Understanding your search…';try{if(!supabase)throw new Error('Natural-language search is temporarily unavailable. Please use the property filters.');const{data,error}=await supabase.functions.invoke('ai-property-search',{body:{prompt}});if(error)throw error;const filters=parseSearchFilters(new URLSearchParams(data.params),'sale');const params=searchParamsFromFilters({...filters,page:1});history.pushState(null,'',`${location.pathname}?${params}#properties`);syncSearchForm();await loadCatalogue();if(status)status.textContent='Showing live listings that match your request.';}catch{if(status)status.textContent='Natural-language search is temporarily unavailable. Please use the property filters.';}finally{if(button)button.disabled=false;}});

const filterDialog = document.querySelector<HTMLDialogElement>('#filter-dialog');
const filterTrigger = document.querySelector<HTMLButtonElement>('.advanced');
if (filterDialog) {
  filterDialog.addEventListener('close', () => { const panel = document.querySelector<HTMLElement>('#advanced-search'); if (panel) { document.querySelector('#property-search')?.append(panel); panel.hidden = true; } filterTrigger?.setAttribute('aria-expanded', 'false'); filterTrigger?.focus(); });
  filterDialog.querySelector('[data-close-filters]')?.addEventListener('click', () => filterDialog.close());
}

document.querySelector('.advanced')?.addEventListener('click', (event) => {
  const button = event.currentTarget as HTMLButtonElement;
  if (filterDialog && matchMedia('(max-width:720px)').matches) {
    const panel = document.querySelector<HTMLElement>('#advanced-search');
    if (panel) { panel.hidden = false; panel.querySelectorAll('input,select,button').forEach(field => field.setAttribute('form', 'property-search')); document.querySelector('#filter-dialog-fields')?.append(panel); }
    filterDialog.showModal(); button.setAttribute('aria-expanded', 'true'); return;
  }
  const panel = document.querySelector<HTMLElement>('#advanced-search');
  if (!panel) return;
  panel.hidden = !panel.hidden;
  button.setAttribute('aria-expanded', String(!panel.hidden));
});

document.querySelector('.clear-search')?.addEventListener('click', () => {
  history.pushState(null, '', `${location.pathname}${demoPreview?'?preview=demo':''}#properties`);
  syncSearchForm();
  void loadCatalogue();
});

document.querySelectorAll<HTMLButtonElement>('.search-tabs [data-listing]').forEach((button) => button.addEventListener('click', () => {
  const params = new URLSearchParams(location.search);
  params.set('listing', button.dataset.listing ?? 'sale');
  params.delete('page');
  const current = new URLSearchParams(location.search);
  if (current.get('view') === 'map') params.set('view', 'map');
  if (current.get('compare')) params.set('compare', current.get('compare')!);
  history.pushState(null, '', `${location.pathname}?${params}#properties`);
  filterDialog?.close();
  syncSearchForm();
  void loadCatalogue();
}));

window.addEventListener('popstate', () => { syncSearchForm(); void loadCatalogue(); });

document.addEventListener('click', async (event) => {
  const target = event.target as HTMLElement;
  const view = target.closest<HTMLElement>('[data-result-view]');
  if (view) { const params = new URLSearchParams(location.search); params.set('view', view.dataset.resultView!); history.pushState(null, '', `${location.pathname}?${params}#properties`); void updateMapView(); return; }
  const details = target.closest<HTMLElement>('[data-details]');
  const save = target.closest<HTMLElement>('[data-save]');
  const page = target.closest<HTMLElement>('[data-page]');
  const compare = target.closest<HTMLElement>('[data-compare]');
  const removeFilter=target.closest<HTMLElement>('[data-remove-filter]');
  if(removeFilter){const params=new URLSearchParams(location.search);params.delete(removeFilter.dataset.removeFilter??'');params.delete('page');history.pushState(null,'',`${location.pathname}?${params}#properties`);syncSearchForm();void loadCatalogue();return;}
  if (target.closest('[data-retry]')) void loadCatalogue();
  if (target.closest('[data-clear-search]')) { history.pushState(null, '', `${location.pathname}${demoPreview?'?preview=demo':''}#properties`); syncSearchForm(); void loadCatalogue(); }
  if (details) { const property = properties.get(details.dataset.details ?? ''); if (property) openProperty(property); }
  if (save) { if(demoPreview){notify('Development preview only — sign in on staging to save properties.');}else try { const saved = await toggleSaved(save.dataset.save ?? ''); save.textContent = saved ? '♥' : '♡'; save.setAttribute('aria-pressed', String(saved)); notify(saved ? 'Property saved.' : 'Property removed.'); } catch { notify('Sign in to save properties, or try again shortly.'); } }
  if (page) { const params = new URLSearchParams(location.search); params.set('page', page.dataset.page ?? '1'); history.pushState(null, '', `?${params}#properties`); void loadCatalogue(); }
  if(compare){try{const params=new URLSearchParams(location.search);const selected=toggleComparisonSlug(parseComparisonSlugs(params.get('compare')),compare.dataset.compare!);if(selected.length)params.set('compare',selected.join(','));else params.delete('compare');history.replaceState(null,'',`${location.pathname}?${params}#properties`);updateComparisonLink();updateComparisonButtons();notify(selected.length?`${selected.length} propert${selected.length===1?'y':'ies'} selected for comparison.`:'Comparison cleared.');}catch(error){notify(error instanceof Error?error.message:'Unable to compare.');}}
  if(target.closest('[data-save-search]')){if(demoPreview){notify('Development preview only — search alerts are not persisted.');}else{const name=window.prompt('Name this property search');if(name!==null){try{await savePropertySearch(name,filtersFromPage());notify('Search saved. Alerts are enabled for new matching listings.');}catch{notify('Search alerts are unavailable. Please sign in or try again later.');}}}}
  const enquire = target.closest<HTMLElement>('[data-enquire]');
  if (enquire) { const property = properties.get(enquire.dataset.enquire ?? ''); if (property) showEnquiry(property); }
  const viewing = target.closest<HTMLElement>('[data-viewing]');
  if (viewing) { const property = properties.get(viewing.dataset.viewing ?? ''); if (property) showViewing(property); }
  const close = target.closest<HTMLElement>('[data-close]');
  if (close?.dataset.close === 'property') propertyDialog?.close();
  if (close?.dataset.close === 'auth') authDialog?.close();
});

document.addEventListener('submit', async (event) => {
  const form = event.target as HTMLFormElement;
  if (form.id === 'viewing-form') {
    event.preventDefault();const data=new FormData(form);const status=form.querySelector<HTMLElement>('[role="status"]');const submit=form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if(submit?.disabled)return;if(submit){submit.disabled=true;submit.textContent='Sending…';}
    try{const preferred=new Date(String(data.get('preferredStart'))).toISOString();const result=await submitViewingRequest({propertyId:form.dataset.propertyId??'',name:String(data.get('name')),email:String(data.get('email')),phone:String(data.get('phone')||''),preferredStart:preferred,mode:String(data.get('mode')) as 'physical'|'virtual',consent:data.get('consent')==='on',idempotencyKey:form.dataset.idempotencyKey??crypto.randomUUID(),website:String(data.get('website')||'')});if(status)status.textContent=`Viewing request ${result.id.slice(0,8)} is ${result.status}. Hilltop will confirm the time.`;if(submit)submit.textContent='Request sent';}
    catch(error){if(status)status.textContent=error instanceof Error?error.message:'Unable to request a viewing.';if(submit){submit.disabled=false;submit.textContent='Request viewing';}}
    return;
  }
  if (form.id !== 'enquiry-form') return;
  event.preventDefault();
  const propertyId = form.closest('#property-detail')?.querySelector<HTMLElement>('[data-enquire]')?.dataset.enquire;
  const data = new FormData(form);
  const status = form.querySelector<HTMLElement>('[role="status"]');
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (submit?.disabled) return;
  if (submit) { submit.disabled = true; submit.textContent = 'Sending…'; }
  try {
    const result = await submitEnquiry({ type: 'property', propertyId, name: String(data.get('name')), email: String(data.get('email')), phone: String(data.get('phone') || ''), message: String(data.get('message')), consent: data.get('consent') === 'on', idempotencyKey: form.dataset.idempotencyKey ?? crypto.randomUUID(), website: String(data.get('website') || '') });
    track('generate_lead', { property_id: propertyId ?? 'general' });
    form.reset(); if (status) status.textContent = `Thank you. Your enquiry reference is ${result.id.slice(0, 8)}.`;
    if (submit) submit.textContent = 'Enquiry sent';
  } catch (error) {
    if (status) status.textContent = error instanceof Error ? error.message : 'Unable to submit your enquiry.';
    if (submit) { submit.disabled = false; submit.textContent = 'Send enquiry'; }
  }
});

document.querySelector('#auth-mode')?.addEventListener('click', () => { authMode = authMode === 'signin' ? 'signup' : 'signin'; const title = document.querySelector('#auth-title'); if (title) title.textContent = authMode === 'signup' ? 'Create an account' : 'Sign in'; document.querySelector<HTMLElement>('#auth-name')?.parentElement?.classList.toggle('hidden', authMode === 'signin'); });
document.querySelector('#auth-reset')?.addEventListener('click', async () => { const email = document.querySelector<HTMLInputElement>('#auth-email')?.value; if (email) { await resetPassword(email); notify('Password recovery email requested.'); } });
document.querySelector('#auth-form')?.addEventListener('submit', async (event) => { event.preventDefault(); const email = document.querySelector<HTMLInputElement>('#auth-email')?.value ?? ''; const password = document.querySelector<HTMLInputElement>('#auth-password')?.value ?? ''; const name = document.querySelector<HTMLInputElement>('#auth-name')?.value ?? ''; const result = authMode === 'signup' ? await signUp(email, password, name) : await signIn(email, password); const feedback = document.querySelector('#auth-feedback'); if (result.error) { if (feedback) feedback.textContent = result.error.message; } else location.reload(); });

initializeAnalytics();
syncSearchForm();
updateComparisonLink();
void Promise.all([setupOptions(), setupAccount(), loadCatalogue()]);

const quickSort = document.querySelector<HTMLSelectElement>('#quick-sort');
function syncQuickSort() { if (quickSort) quickSort.value = new URLSearchParams(location.search).get('sort') || 'newest'; }
syncQuickSort();
quickSort?.addEventListener('change', () => { const params = new URLSearchParams(location.search); params.set('sort', quickSort.value); params.delete('page'); history.pushState(null, '', `${location.pathname}?${params}#properties`); syncSearchForm(); void loadCatalogue(); });
window.addEventListener('popstate', () => { syncQuickSort(); updateComparisonButtons(); void updateMapView(); });

// Keep the narrow catalogue focused on quick search; detailed fields stay in the drawer.
const mobileFilters = matchMedia('(max-width:720px)');
const quickFields = [...document.querySelectorAll<HTMLElement>('.catalogue-page #property-search > label')].slice(1);
function arrangeQuickFields() {
  const panel=document.querySelector<HTMLElement>('#advanced-search');
  if(!panel)return;
  if(mobileFilters.matches) { quickFields.forEach(field=>panel.prepend(field)); panel.hidden=true; }
  else { const button=document.querySelector('#property-search > button'); quickFields.forEach(field=>button?.before(field)); }
}
arrangeQuickFields();
mobileFilters.addEventListener('change', arrangeQuickFields);

installPropertyImageFallbacks();

// Arrow-key navigation keeps listing tabs operable without a pointer.
const listingTabs=[...document.querySelectorAll<HTMLButtonElement>('.search-tabs [role="tab"]')];
listingTabs.forEach((tab,index)=>tab.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();
  const next=event.key==='Home'?0:event.key==='End'?listingTabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+listingTabs.length)%listingTabs.length;
  listingTabs[next].focus();listingTabs[next].click();
}));
