import { installPropertyImageFallbacks } from './property-images';
import { config } from './config';
import { propertyFacts, propertyPrice } from './property-presentation';
import { parseComparisonSlugs } from './comparison';
import { getPropertiesBySlugs, imageUrl } from './services/properties';
import { safeText } from './validation';
import type { Property } from './types';

const target = document.querySelector<HTMLElement>('#comparison')!;

function value(property: Property, key: string) {
  if (key === 'price') return propertyPrice(property);
  if (key === 'location') return property.location?.name ?? '—';
  if (key === 'type') return property.property_type?.name ?? '—';
  if (key === 'floor' || key === 'land' || key === 'bedrooms' || key === 'bathrooms') { const label = {floor:'Floor area',land:'Land area',bedrooms:'Bedrooms',bathrooms:'Bathrooms'}[key]; return propertyFacts(property).find(fact=>fact.label===label)?.value || 'Not applicable'; }
  if (key === 'amenities') return property.amenities.map((item) => item.amenity?.name).filter(Boolean).join(', ') || '—';
  if (key === 'availability') return property.is_available ? 'Available' : 'Unavailable';
  if (key === 'verification') return property.verification_status;
  return String(property[key as keyof Property] ?? '—');
}

function emptyState(eyebrow: string, title: string, message: string) {
  target.innerHTML = `<div class="catalogue-state premium-state"><p class="eyebrow">${eyebrow}</p><h2>${title}</h2><p>${message}</p><a class="button button-dark" href="/properties.html">Browse properties</a></div>`;
}

async function init() {
  const preview=import.meta.env.DEV&&new URLSearchParams(location.search).get('preview')==='demo';
  if (!config&&!preview) {
    emptyState('Comparison workspace', 'Comparison is temporarily unavailable.', 'We cannot load current listings. Please try again later or contact Hilltop for help.');
    return;
  }
  const slugs = parseComparisonSlugs(new URLSearchParams(location.search).get('properties'));
  if (!slugs.length) {
    emptyState('Your shortlist', 'No properties selected.', 'Add up to four available listings from the property catalogue.');
    return;
  }
  try {
    const properties = preview?(await import('./demo-catalogue')).demoProperties.filter((property)=>property.is_available&&slugs.includes(property.slug)):await getPropertiesBySlugs(slugs);
    if (!properties.length) {
      emptyState('Selection unavailable', 'No available properties.', 'The selected listings are unavailable or no longer published.');
      return;
    }
    const rows: [string, string][] = [['Price', 'price'], ['Location', 'location'], ['Type', 'type'], ['Bedrooms', 'bedrooms'], ['Bathrooms', 'bathrooms'], ['Floor area', 'floor'], ['Land area', 'land'], ['Amenities', 'amenities'], ['Condition', 'condition'], ['Availability', 'availability'], ['Verification', 'verification']];
    target.innerHTML = `${preview?'<p class="demo-notice" role="note"><b>Development preview</b> — synthetic properties; comparison is not saved.</p>':''}<label class="comparison-differences"><input type="checkbox" id="differences-only"/> Show differences only</label><div class="comparison-scroll"><table class="comparison-table${properties.length === 2 ? ' comparison-pair' : ''}"><caption class="sr-only">Selected property specifications</caption><thead><tr><th scope="col">Feature</th>${properties.map((property) => {const image=[...property.images].sort((a,b)=>a.position-b.position)[0];return `<th scope="col">${image?`<img class="comparison-image" src="${safeText(imageUrl(image.storage_path))}" alt=""/>`:''}<a href="/property/${safeText(property.slug)}${preview?'?preview=demo':''}">${safeText(property.title)}</a><button class="link-button" data-remove="${safeText(property.slug)}" aria-label="Remove ${safeText(property.title)}">Remove</button></th>`;}).join('')}</tr></thead><tbody>${rows.map(([label, key]) => `<tr data-different="${new Set(properties.map(property => value(property,key))).size > 1}"><th scope="row">${label}</th>${properties.map((property) => `<td>${safeText(value(property, key))}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p><button class="button button-dark" id="share-comparison">Copy comparison link</button></p><p id="comparison-feedback" role="status"></p>`;
    document.querySelector('#differences-only')?.addEventListener('change', event => { const checked=(event.target as HTMLInputElement).checked; target.querySelectorAll<HTMLTableRowElement>('tr[data-different="false"]').forEach(row=>row.hidden=checked); });
    document.querySelector('#share-comparison')?.addEventListener('click', async () => { const feedback=document.querySelector<HTMLElement>('#comparison-feedback')!;try{await navigator.clipboard.writeText(location.href);feedback.textContent='Comparison link copied.';}catch{feedback.textContent='Copy the address from your browser to share this comparison.';} });
    target.querySelectorAll<HTMLElement>('[data-remove]').forEach((button)=>button.addEventListener('click',()=>{const remaining=slugs.filter((slug)=>slug!==button.dataset.remove);const params=new URLSearchParams();if(remaining.length)params.set('properties',remaining.join(','));if(preview)params.set('preview','demo');location.href=`/compare.html?${params}`;}));
  } catch {
    emptyState('Please try again', 'Comparison temporarily unavailable.', 'We could not load the selected properties.');
  }
}

void init();

installPropertyImageFallbacks();
