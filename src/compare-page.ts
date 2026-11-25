import { config } from './config';
import { parseComparisonSlugs } from './comparison';
import { getPropertiesBySlugs, imageUrl } from './services/properties';
import { safeText } from './validation';
import type { Property } from './types';

const target = document.querySelector<HTMLElement>('#comparison')!;

function value(property: Property, key: string) {
  if (key === 'price') return property.price === null ? 'On enquiry' : new Intl.NumberFormat('en-ZM', { style: 'currency', currency: property.currency, maximumFractionDigits: 0 }).format(property.price);
  if (key === 'location') return property.location?.name ?? '—';
  if (key === 'type') return property.property_type?.name ?? '—';
  if (key === 'size') return property.floor_size ? `${property.floor_size} m²` : property.land_size ? `${property.land_size} ${property.land_unit ?? 'm²'}` : '—';
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
    emptyState('Comparison workspace', 'Connect the property catalogue.', 'This deployment needs its public Supabase configuration before live listings can be compared.');
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
    const rows: [string, string][] = [['Price', 'price'], ['Location', 'location'], ['Type', 'type'], ['Bedrooms', 'bedrooms'], ['Bathrooms', 'bathrooms'], ['Size', 'size'], ['Amenities', 'amenities'], ['Condition', 'condition'], ['Availability', 'availability'], ['Verification', 'verification']];
    target.innerHTML = `${preview?'<p class="demo-notice" role="note"><b>Development preview</b> — synthetic properties; comparison is not saved.</p>':''}<div class="comparison-scroll"><table class="comparison-table"><thead><tr><th>Feature</th>${properties.map((property) => {const image=[...property.images].sort((a,b)=>a.position-b.position)[0];return `<th>${image?`<img class="comparison-image" src="${safeText(imageUrl(image.storage_path))}" alt=""/>`:''}<a href="/property/${safeText(property.slug)}${preview?'?preview=demo':''}">${safeText(property.title)}</a><button class="link-button" data-remove="${safeText(property.slug)}">Remove</button></th>`;}).join('')}</tr></thead><tbody>${rows.map(([label, key]) => `<tr><th>${label}</th>${properties.map((property) => `<td>${safeText(value(property, key))}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p><button class="button button-dark" id="share-comparison">Copy comparison link</button></p>`;
    document.querySelector('#share-comparison')?.addEventListener('click', () => void navigator.clipboard.writeText(location.href));
    target.querySelectorAll<HTMLElement>('[data-remove]').forEach((button)=>button.addEventListener('click',()=>{const remaining=slugs.filter((slug)=>slug!==button.dataset.remove);const params=new URLSearchParams();if(remaining.length)params.set('properties',remaining.join(','));if(preview)params.set('preview','demo');location.href=`/compare.html?${params}`;}));
  } catch {
    emptyState('Please try again', 'Comparison temporarily unavailable.', 'We could not load the selected properties.');
  }
}

void init();
